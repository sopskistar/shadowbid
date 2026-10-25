#!/usr/bin/env python3
"""Private, one-shot public-testnet receiver snapshot. Never prints wallet secrets."""

import base64
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import signal
import subprocess
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


def wallet_command(image, command):
    raw = docker(
        "run", "--rm", "--network", "none", "--user", "1000:1000", "--read-only", "--cap-drop", "ALL",
        "--mount", f"type=bind,src={WALLET},dst=/wallet", "--entrypoint", "sh",
        image, "-c", 'umask 077; exec /src/target/release/zingo-cli "$@"', "zingo-cli",
        "--chain", "testnet", "--data-dir", "/wallet", "--offline", "--nosync", command, timeout=45,
    )
    return json.loads(raw)


def scan_snapshot(image):
    height = int(wallet_command(image, "height")["height"])
    addresses = wallet_command(image, "addresses")
    if RECEIVER not in json.dumps(addresses):
        raise RuntimeError("Existing receiver is absent from wallet addresses")
    note_groups = wallet_command(image, "notes")
    notes = []
    for pool in ("ironwood", "orchard", "sapling"):
        for item in note_groups[f"{pool}_notes"]["note_summaries"]:
            status = str(item["status"])
            match = re.fullmatch(r"Confirmed at block height (\d+)", status)
            notes.append({
                "pool": pool, "txid": str(item["txid"]), "output_index": int(item["output_index"]),
                "value_zats": int(item["value"]), "status": status,
                "height": int(match.group(1)) if match else None,
                "account_id": int(item["account_id"]), "scope": str(item["scope"]),
            })
    return height, notes


def main():
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
        docker("stop", "--time", "10", CONTAINER, timeout=30)
        try:
            wallet_height, notes = scan_snapshot(image)
        finally:
            docker("start", CONTAINER, timeout=30)
            (WALLET / "zingo-wallet.dat").chmod(0o600)
            signal.signal(signal.SIGTERM, previous)
        tip = int(chain["blocks"])
        if wallet_height > tip + 1:
            raise RuntimeError("Receiver height exceeds Zebra tip")
        for note in notes:
            if note["height"] is not None:
                block = rpc("getblock", [str(note["height"]), 1])
                if note["txid"] not in block["tx"]:
                    raise RuntimeError("Wallet note transaction absent from Zebra block")
                note["confirmations"] = max(0, tip - note["height"] + 1)
        observation = {"observed_at": datetime.now(timezone.utc).isoformat(), "chain": "test", "receiver_owned": True, "wallet_height": wallet_height, "zebra_tip": tip, "notes": notes}
        with (WALLET / "observations.jsonl").open("a", encoding="utf8") as out:
            out.write(json.dumps(observation, separators=(",", ":")) + "\n")
            out.flush()
            os.fsync(out.fileno())
        print(json.dumps(observation, separators=(",", ":")))


if __name__ == "__main__":
    main()
