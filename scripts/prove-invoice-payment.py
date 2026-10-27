#!/usr/bin/env python3
"""Build and sign Invoice A on a disposable wallet copy with networking disabled.

The signed transaction stays in the temporary copy and is discarded. This
checks proving capability and does not authorize or perform a broadcast.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('preflight', ROOT / 'scripts/prepare-invoice-payment.py')
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)
receiver = preflight.receiver


def main():
    os.umask(0o077)
    report = json.loads((ROOT / '.env.invoice-experiment/payment-preflight.json').read_text())
    sender = ROOT / '.env.nu7-receiver/bin/zingo-send-cli'
    with sender.open('rb') as binary:
        if hashlib.file_digest(binary, 'sha256').hexdigest() != report['sender_sha256']:
            raise ValueError('Sender differs from reviewed proposal')
    address, amount = report['invoice_a_address'], report['amount_zats']
    if not re.fullmatch(r'utest1[0-9a-z]+', address) or amount != '1000000':
        raise ValueError('Unexpected test payment')
    with tempfile.TemporaryDirectory(prefix='.proof-', dir=receiver.WALLET) as directory:
        copy = Path(directory)
        with receiver.paused_wallet() as image:
            shutil.copyfile(receiver.WALLET / 'zingo-wallet.dat', copy / 'zingo-wallet.dat')
            (copy / 'zingo-wallet.dat').chmod(0o600)
        args = ['docker', 'run', '--rm', '-i', '--network', 'none', '--user', '1000:1000',
                '--read-only', '--cap-drop', 'ALL', '--mount', f'type=bind,src={copy},dst=/wallet',
                '--mount', f'type=bind,src={sender},dst=/sender,readonly', '--entrypoint', '/sender',
                image, '--chain', 'testnet', '--data-dir', '/wallet', '--offline', '--nosync']
        result = subprocess.run(args, input=f'send {address} {amount}\ncalculate\nquit\n',
                                text=True, capture_output=True, timeout=240, check=True)
        # Retain diagnostics privately; stdout exposes neither raw transactions
        # nor the unbroadcast transaction identifier as payment evidence.
        preflight.worker.atomic_private(ROOT / '.env.invoice-experiment/offline-proof-diagnostics.json',
                                        {'stdout': result.stdout, 'stderr': result.stderr})
        fee = re.search(r'"fee"\s*:\s*(\d+)', result.stdout)
        txids = re.search(r'"txids"\s*:\s*\[\s*"([a-f0-9]{64})"\s*\]', result.stdout)
        if not fee or int(fee[1]) != report['fee_zats'] or not txids:
            raise ValueError('Exact proposal and proof did not complete')
    print('PASS: invoice-A proposal, exact quoted fee, shielded proof and signing completed offline. '
          'Temporary signed transaction discarded; no broadcast occurred.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError, KeyError):
        print('Offline proof not verified; no broadcast occurred. Inspect private diagnostics.')
        raise SystemExit(1) from None
