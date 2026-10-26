#!/usr/bin/env python3
"""Private, one-shot public-testnet receiver snapshot. Never prints wallet secrets."""

import base64
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import signal
import shutil
import subprocess
import tempfile
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
WALLET = ROOT / ".env.nu7-receiver"
CONTAINER = "shadowbid-nu7-receiver-scan"
RECEIVER = "utest1hfkt0vcaz6lpkv6u8p8xqzjv69ns68eywmv0d54zlsqjc6qt9ffrp44tjj3kfaz6x7t8u6ddcwvufuukhw640y6djf7x7xj64chnldan"


def docker(*args, timeout=45):
    return subprocess.check_output(["docker", *args], timeout=timeout, stderr=subprocess.DEVNULL)


def rpc(method, params=None):
    cookie = docker("exec", "z3-testnet-zebra-1", "cat", "/var/run/auth/.cookie").strip()
    request = urllib.request.Request(
        "http://127.0.0.1:18232",
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params or []}).encode(),
        headers={"Authorization": "Basic " + base64.b64encode(cookie).decode(), "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.load(response)
    if result.get("error"):
        raise RuntimeError("Zebra RPC rejected a request")
    return result["result"]


def wallet_command(image, *command, wallet_directory=None):
    adapter = os.environ.get("SHADOWBID_ZINGO_INVOICE_CLI")
    adapter_mount = []
    executable = "/src/target/release/zingo-cli"
    if adapter:
        adapter_path = Path(adapter).resolve(strict=True)
        if not adapter_path.is_file():
            raise RuntimeError("Invoice CLI adapter is not a regular file")
        adapter_mount = ["--mount", f"type=bind,src={adapter_path},dst=/invoice-zingo-cli,readonly"]
        executable = "/invoice-zingo-cli"
    raw = docker(
        "run", "--rm", "--network", "none", "--user", "1000:1000", "--read-only", "--cap-drop", "ALL",
        "--mount", f"type=bind,src={wallet_directory or WALLET},dst=/wallet", *adapter_mount, "--entrypoint", "sh",
        image, "-c", f'umask 077; exec {executable} "$@"', "zingo-cli",
        "--chain", "testnet", "--data-dir", "/wallet", "--offline", "--nosync", *command, timeout=45,
    )
    return json.loads(raw)


def scan_snapshot(image, wallet_directory=None):
    height = int(wallet_command(image, "height", wallet_directory=wallet_directory)["height"])
    addresses = wallet_command(image, "addresses", wallet_directory=wallet_directory)
    known_addresses = {entry["encoded_address"] for entry in addresses}
    if RECEIVER not in known_addresses:
        raise RuntimeError("Existing receiver is absent from wallet addresses")
    # Include spent notes: a later spend must not erase a received invoice payment.
    note_groups = wallet_command(image, "notes", "all", wallet_directory=wallet_directory)
    notes = []
    for pool in ("ironwood", "orchard", "sapling"):
        for item in note_groups[f"{pool}_notes"]["note_summaries"]:
            status = str(item["status"])
            match = re.fullmatch(r"confirmed at block height (\d+)", status, re.IGNORECASE)
            if os.environ.get("SHADOWBID_ZINGO_INVOICE_CLI") and "recipient_unified_address" not in item:
                raise RuntimeError("Invoice CLI adapter omitted note recipient metadata")
            recipient = item.get("recipient_unified_address")
            if recipient is not None and recipient not in known_addresses:
                raise RuntimeError("Decrypted note recipient is absent from wallet addresses")
            notes.append({
                "pool": pool, "txid": str(item["txid"]), "output_index": int(item["output_index"]),
                "value_zats": int(item["value"]), "status": status,
                "height": int(match.group(1)) if match else None,
                "account_id": int(item["account_id"]), "scope": str(item["scope"]),
                "recipient_unified_address": recipient,
            })
    return height, notes, addresses


@contextmanager
def paused_wallet():
    """Serialize wallet access and resume the existing scanner on every exit."""
    os.umask(0o077)
    if not WALLET.is_dir():
        raise RuntimeError("Receiver wallet directory missing")
    WALLET.chmod(0o700)
    (WALLET / "zingo-wallet.dat").chmod(0o600)
    with (WALLET / "observe.lock").open("a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        info = json.loads(docker("inspect", CONTAINER))[0]
        sources = [Path(m["Source"]).resolve() for m in info["Mounts"] if m["Destination"] == "/wallet"]
        if sources != [WALLET.resolve()] or info["NetworkSettings"]["Ports"]:
            raise RuntimeError("Receiver mount or port exposure changed")
        if not info["State"]["Running"]:
            raise RuntimeError("Receiver scanner is not running")
        chain = rpc("getblockchaininfo")
        if chain["chain"] != "test":
            raise RuntimeError("Zebra is not on public testnet")
        image = info["Config"]["Image"]
        previous = signal.getsignal(signal.SIGTERM)
        signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
        try:
            docker("stop", "--time", "10", CONTAINER, timeout=30)
            yield image
        finally:
            docker("start", CONTAINER, timeout=30)
            (WALLET / "zingo-wallet.dat").chmod(0o600)
            signal.signal(signal.SIGTERM, previous)


def active_notes(notes, wallet_height):
    chain = rpc("getblockchaininfo")
    if chain["chain"] != "test":
        raise RuntimeError("Zebra is not on public testnet")
    tip = int(chain["blocks"])
    if not -1 <= tip - wallet_height <= 2:
        raise RuntimeError("Receiver is not at the current Zebra tip")
    tip_hash = rpc("getblockhash", [tip])
    verified = []
    blocks = {}
    for note in notes:
        confirmations = 0
        if note["height"] is not None:
            height = note["height"]
            if height > tip:
                continue
            if height not in blocks:
                block_hash = rpc("getblockhash", [height])
                block = rpc("getblock", [block_hash, 1])
                if block.get("hash") != block_hash:
                    raise RuntimeError("Zebra returned an inconsistent active block")
                blocks[height] = block
            # Reorged notes are absent from the authoritative snapshot. The app
            # reconciles the entire snapshot, so prior credit is rolled back.
            if note["txid"] not in blocks[height]["tx"]:
                continue
            confirmations = tip - height + 1
        verified.append({**note, "confirmations": confirmations})
    if rpc("getblockhash", [tip]) != tip_hash:
        raise RuntimeError("Active chain changed during observation; retry")
    return tip, tip_hash, verified


def append_private(path, value):
    with path.open("a", encoding="utf8") as out:
        os.fchmod(out.fileno(), 0o600)
        out.write(json.dumps(value, separators=(",", ":")) + "\n")
        out.flush()
        os.fsync(out.fileno())


def observe():
    # Pause only long enough to copy the saved wallet. Offline CLI startup and
    # note inspection run on a private temporary copy while scanning continues.
    with tempfile.TemporaryDirectory(prefix=".observe-", dir=WALLET) as directory:
        snapshot_path = Path(directory)
        snapshot_path.chmod(0o700)
        with paused_wallet() as image:
            shutil.copyfile(WALLET / "zingo-wallet.dat", snapshot_path / "zingo-wallet.dat")
            (snapshot_path / "zingo-wallet.dat").chmod(0o600)
        wallet_height, notes, addresses = scan_snapshot(image, snapshot_path)
    tip, tip_hash, notes = active_notes(notes, wallet_height)
    observation = {
        "schema_version": 2, "observed_at": datetime.now(timezone.utc).isoformat(),
        "chain": "test", "receiver_owned": True, "wallet_height": wallet_height,
        "zebra_tip": tip, "zebra_tip_hash": tip_hash, "notes": notes,
        "recipient_metadata": bool(os.environ.get("SHADOWBID_ZINGO_INVOICE_CLI")),
        "owned_addresses": addresses,
    }
    append_private(WALLET / "observations.jsonl", observation)
    return observation


def main():
    print(json.dumps(observe(), separators=(",", ":")))


if __name__ == "__main__":
    main()
