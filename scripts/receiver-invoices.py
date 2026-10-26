#!/usr/bin/env python3
"""Owner-only, loopback public-testnet invoice experiment. No production mode."""

import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import time
import urllib.parse
import urllib.request
import uuid

spec = importlib.util.spec_from_file_location("receiver_observe", Path(__file__).with_name("receiver-observe.py"))
receiver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receiver)


def integer(value, minimum=0):
    if type(value) is not int or value < minimum or value > 21_000_000 * 100_000_000:
        raise ValueError("Invalid exact integer")
    return value


def load_config(path):
    st = path.stat()
    if st.st_uid != os.getuid() or st.st_mode & 0o077:
        raise ValueError("Experiment config must be owned by this user and mode 600")
    config = json.loads(path.read_text())
    url = urllib.parse.urlsplit(config["app_url"])
    if (url.scheme != "http" or url.hostname not in ("127.0.0.1", "localhost", "::1")
            or url.username or url.password or url.path not in ("", "/") or url.query or url.fragment):
        raise ValueError("This experiment supports a loopback app only; production is disabled")
    if len(config["worker_secret"]) < 32:
        raise ValueError("Experiment requires a private worker secret")
    config["app_url"] = config["app_url"].rstrip("/")
    return config


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):
        raise RuntimeError("Worker API redirects are forbidden")


def api(config, path, body=None):
    method = "GET" if body is None else "POST"
    raw = "" if body is None else json.dumps(body, separators=(",", ":"))
    timestamp, nonce = str(int(time.time() * 1000)), secrets.token_hex(16)
    signed = f"{timestamp}\n{nonce}\n{method}\n{path}\n{raw}"
    signature = hmac.new(config["worker_secret"].encode(), signed.encode(), hashlib.sha256).hexdigest()
    request = urllib.request.Request(config["app_url"] + path, method=method,
        data=raw.encode() if body is not None else None, headers={
            "Content-Type": "application/json", "x-sb-time": timestamp,
            "x-sb-nonce": nonce, "x-sb-signature": signature,
        })
    with urllib.request.build_opener(NoRedirect).open(request, timeout=20) as response:
        return json.load(response)


def atomic_private(path, value):
    temporary = path.with_name(path.name + "." + secrets.token_hex(8) + ".tmp")
    with temporary.open("x", encoding="utf8") as out:
        os.fchmod(out.fileno(), 0o600)
        json.dump(value, out, separators=(",", ":"))
        out.flush()
        os.fsync(out.fileno())
    os.replace(temporary, path)
    fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def backup_wallet(path):
    # Exclusive creation preserves every prior protected wallet backup.
    with path.open("xb") as out, (receiver.WALLET / "zingo-wallet.dat").open("rb") as source:
        os.fchmod(out.fileno(), 0o600)
        shutil.copyfileobj(source, out)
        out.flush()
        os.fsync(out.fileno())


def validate_binding(binding, config, invoice):
    if (binding["invoice_id"] != invoice["id"] or binding["app_url"] != config["app_url"]
            or binding["amount_zats"] != invoice["amountZats"] or binding["network"] != "testnet"):
        raise ValueError("Persisted invoice association mismatch")
    if invoice["address"] is not None and (invoice["address"] != binding["address"]
            or invoice["walletAccount"] != binding["binding_id"]):
        raise ValueError("App receiver differs from protected local association")


def assign(config, invoice, directory):
    path = directory / (invoice["id"] + ".json")
    if path.exists():
        binding = json.loads(path.read_text())
        validate_binding(binding, config, invoice)
    else:
        if invoice["address"] is not None:
            raise ValueError("Invoice already assigned outside this experiment")
        if datetime.fromisoformat(invoice["deadline"].replace("Z", "+00:00")) <= datetime.now(timezone.utc):
            raise ValueError("Invoice expired")
        if not re.fullmatch(r"[1-9][0-9]*", invoice["amountZats"]):
            raise ValueError("Invalid invoice amount")
        integer(int(invoice["amountZats"]), 1)
        snapshot = receiver.observe()
        if not snapshot["recipient_metadata"]:
            raise ValueError("A verified recipient adapter is required")
        with receiver.paused_wallet() as image:
            before = receiver.wallet_command(image, "addresses")
            stamp = secrets.token_hex(8)
            backup_wallet(directory / ("wallet-before-" + stamp + ".dat"))
            created = receiver.wallet_command(image, "new_address", "o")
            address = created["encoded_address"]
            if (not address.startswith("utest1") or created["account"] != 0
                    or created["has_orchard"] is not True or created["has_transparent"] is not False
                    or address in {item["encoded_address"] for item in before}):
                raise ValueError("Wallet did not derive a distinct shielded testnet receiver")
            # A new process reloads the wallet: persistence and ownership are checked.
            addresses = receiver.wallet_command(image, "addresses")
            if created not in addresses:
                raise ValueError("New receiver did not survive wallet reload")
            control = receiver.wallet_command(image, "check_address", address)
            if str(control.get("is_wallet_address")).lower() != "true":
                raise ValueError("Wallet failed receiver ownership check")
            binding = {"schema_version": 1, "invoice_id": invoice["id"],
                "binding_id": str(uuid.uuid4()), "address": address,
                "wallet_account_id": 0, "address_index": created["address_index"],
                "network": "testnet", "amount_zats": invoice["amountZats"],
                "app_url": config["app_url"], "created_at": datetime.now(timezone.utc).isoformat()}
            backup_wallet(directory / ("wallet-after-" + stamp + ".dat"))
            atomic_private(path, binding)
    # Local mapping is durable before the address can become visible in checkout.
    if invoice["address"] is None:
        api(config, "/api/worker/assign", {"id": invoice["id"],
            "walletAccount": binding["binding_id"], "address": binding["address"]})
    return binding


def match_notes(snapshot, binding):
    if (snapshot.get("schema_version") != 2 or snapshot.get("chain") != "test"
            or snapshot.get("recipient_metadata") is not True or snapshot.get("receiver_owned") is not True):
        raise ValueError("Missing verified public-testnet wallet snapshot")
    observed = datetime.fromisoformat(snapshot["observed_at"].replace("Z", "+00:00"))
    age = (datetime.now(timezone.utc) - observed).total_seconds()
    if not 0 <= age <= 60:
        raise ValueError("Wallet snapshot is stale")
    tip = integer(snapshot["zebra_tip"])
    if not -1 <= tip - integer(snapshot["wallet_height"]) <= 2:
        raise ValueError("Wallet is not synchronized")
    if not re.fullmatch(r"[a-f0-9]{64}", snapshot.get("zebra_tip_hash", "")):
        raise ValueError("Missing active-chain anchor")
    owned = [a for a in snapshot["owned_addresses"] if a["encoded_address"] == binding["address"]]
    if (len(owned) != 1 or owned[0]["account"] != binding["wallet_account_id"]
            or owned[0]["address_index"] != binding["address_index"]
            or owned[0]["has_orchard"] is not True or owned[0]["has_transparent"] is not False):
        raise ValueError("Invoice receiver ownership mismatch")
    result, seen = [], set()
    for note in snapshot["notes"]:
        if note.get("recipient_unified_address") != binding["address"]:
            continue
        # The experiment intentionally accepts Ironwood only. Existing app output
        # identity is txid/index, so mixing shielded pools would be ambiguous.
        if note["pool"] != "ironwood":
            raise ValueError("Invoice received an unsupported pool; manual review required")
        if note["scope"] != "external" or note["account_id"] != binding["wallet_account_id"]:
            raise ValueError("Invoice note key scope mismatch")
        txid, index = note["txid"], integer(note["output_index"])
        if not re.fullmatch(r"[a-f0-9]{64}", txid):
            raise ValueError("Invalid wallet transaction identity")
        key = (txid, index)
        if key in seen:
            raise ValueError("Duplicate wallet note")
        seen.add(key)
        value = integer(note["value_zats"], 1)
        confirmations = integer(note["confirmations"])
        height = note["height"]
        if height is None:
            if confirmations != 0:
                raise ValueError("Unmined note has confirmations")
        elif not 0 < integer(height) <= tip or confirmations != tip - height + 1:
            raise ValueError("Inconsistent active-chain confirmations")
        result.append({"txid": txid, "outIndex": index,
            "amountZats": str(value), "confirmations": confirmations})
    return result


def tick(config, invoice_id, directory, allow_assignment=False):
    adapter = Path(os.environ.get("SHADOWBID_ZINGO_INVOICE_CLI", ""))
    if not adapter.is_file():
        raise ValueError("Recipient adapter is missing")
    with adapter.open("rb") as binary:
        adapter_digest = hashlib.file_digest(binary, "sha256").hexdigest()
    if adapter_digest != config.get("adapter_sha256"):
        raise ValueError("Recipient adapter does not match the verified experiment binary")
    invoices = api(config, "/api/worker/invoices")
    matches = [i for i in invoices if i["id"] == invoice_id]
    if len(matches) != 1:
        raise ValueError("Selected invoice is unavailable or has not passed the app control gate")
    invoice = matches[0]
    path = directory / (invoice_id + ".json")
    if allow_assignment:
        binding = assign(config, invoice, directory)
        if invoice["address"] is None:
            # Derivation used an offline wallet session. Allow the scanner to
            # catch up before issuing a fresh readiness heartbeat.
            api(config, "/api/worker/health", {"state": "error"})
            return {"status": "receiver_assigned_waiting_for_scan", "confirmedZats": "0"}
    else:
        binding = json.loads(path.read_text())
        validate_binding(binding, config, invoice)
        if invoice["address"] is None:
            raise ValueError("Invoice assignment has not been accepted by the app")
    snapshot = receiver.observe()
    response = None
    # The app's heartbeat covers the whole wallet. Reconcile every assigned
    # invoice before publishing it, even when the command selected one invoice.
    for assigned in invoices:
        if assigned["address"] is None:
            continue
        association = json.loads((directory / (assigned["id"] + ".json")).read_text())
        validate_binding(association, config, assigned)
        notes = match_notes(snapshot, association)
        result = api(config, "/api/worker/observe", {"id": assigned["id"],
            "walletAccount": association["binding_id"], "notes": notes})
        receiver.append_private(directory / "events.jsonl", {"observed_at": snapshot["observed_at"],
            "invoice_id": assigned["id"], "tip": snapshot["zebra_tip"], "tip_hash": snapshot["zebra_tip_hash"],
            "notes": notes, "response": result})
        if assigned["id"] == invoice_id:
            response = result
    if response is None:
        raise ValueError("Selected invoice was not reconciled")
    api(config, "/api/worker/health", {"state": "connected", "details": "Zebra chain cross-check enabled"})
    return response


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("assign", "observe", "watch"))
    parser.add_argument("invoice_id", type=uuid.UUID)
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    os.umask(0o077)
    config = load_config(args.config)
    if not os.environ.get("SHADOWBID_ZINGO_INVOICE_CLI"):
        raise ValueError("Set the private compiled recipient adapter path")
    directory = receiver.WALLET / "invoices"
    directory.mkdir(mode=0o700, exist_ok=True)
    directory.chmod(0o700)
    with (directory / "worker.lock").open("a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        while True:
            delay = 15
            try:
                response = tick(config, str(args.invoice_id), directory, args.command == "assign")
                print(json.dumps({"experiment": True, "status": response["status"],
                    "confirmed_zats": response["confirmedZats"]}), flush=True)
            except Exception:
                try:
                    api(config, "/api/worker/health", {"state": "error"})
                except Exception:
                    pass
                # Never log raw API bodies, private paths, tokens, or RPC responses.
                print("Invoice experiment unavailable; inspect protected local state", flush=True)
                delay = 60
                if args.command != "watch":
                    raise SystemExit(1) from None
            if args.command != "watch":
                break
            time.sleep(delay)


if __name__ == "__main__":
    main()
