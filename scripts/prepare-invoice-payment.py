#!/usr/bin/env python3
"""Inspect spending authority and quote invoice A on an offline wallet copy.

Never signs or broadcasts. The original scanner is paused only for a coherent
snapshot, and every CLI command runs with Docker networking disabled.
"""
from datetime import datetime, timezone
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('acceptance', ROOT / 'scripts/check-invoice-settlement.py')
acceptance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acceptance)
worker = acceptance.worker
receiver = worker.receiver


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sender-cli', type=Path)
    args = parser.parse_args()
    os.chdir(ROOT)
    os.umask(0o077)
    config = worker.load_config(ROOT / '.env.invoice-experiment/worker.json')
    adapter = ROOT / '.env.nu7-receiver/bin/zingo-invoice-cli'
    with adapter.open('rb') as binary:
        if hashlib.file_digest(binary, 'sha256').hexdigest() != config['adapter_sha256']:
            raise ValueError('Recipient adapter hash mismatch')
    os.environ['SHADOWBID_ZINGO_INVOICE_CLI'] = str(adapter)
    sender = (args.sender_cli or Path(os.environ.get('SHADOWBID_ZINGO_SENDER_CLI', str(adapter)))).resolve(strict=True)
    with sender.open('rb') as binary:
        sender_hash = hashlib.file_digest(binary, 'sha256').hexdigest()
    query = acceptance.READ_ROWS.replace('network,status,amount_zats', 'network,status,deadline,amount_zats')
    result = subprocess.run(['node', '--input-type=module', '-e', query],
                            check=True, capture_output=True, text=True, timeout=30)
    rows = json.loads(result.stdout)
    if len(rows) != 2 or rows[0]['address'] == rows[1]['address']:
        raise ValueError('Expected two distinct existing receivers')
    for index, row in enumerate(rows):
        binding = json.loads((receiver.WALLET / 'invoices' / (row['id'] + '.json')).read_text())
        if (row['network'] != 'testnet' or row['amount_zats'] != ('1000000', '2000000')[index]
                or row['address'] != binding['address'] or row['wallet_account'] != binding['binding_id']
                or row['status'] != 'awaiting' or row['paid_zats'] != '0' or row['notes']):
            raise ValueError('Invoice mapping or unpaid state changed; review required')
        if datetime.fromisoformat(row['deadline'].replace('Z', '+00:00')) <= datetime.now(timezone.utc):
            raise ValueError('Test invoice expired; do not send')
    with tempfile.TemporaryDirectory(prefix='.preflight-', dir=receiver.WALLET) as directory:
        snapshot = Path(directory)
        with receiver.paused_wallet() as image:
            shutil.copyfile(receiver.WALLET / 'zingo-wallet.dat', snapshot / 'zingo-wallet.dat')
            (snapshot / 'zingo-wallet.dat').chmod(0o600)
        def command(*args):
            return receiver.wallet_command(image, *args, wallet_directory=snapshot)
        height, notes, addresses = receiver.scan_snapshot(image, snapshot)
        tip, _, active = receiver.active_notes(notes, height)
        for row in rows:
            if row['address'] not in {a['encoded_address'] for a in addresses}:
                raise ValueError('Receiver absent from wallet')
            if str(command('check_address', row['address']).get('is_wallet_address')).lower() != 'true':
                raise ValueError('Receiver ownership check failed')
        kind = command('wallet_kind')
        balance = command('spendable_balance')
        print(json.dumps({'wallet_kind': kind, 'spendable': balance,
                          'wallet_height': height, 'active_chain_height': tip,
                          'active_note_count': len(active)}, indent=2), flush=True)
        if kind.get('kind') not in ('Loaded from mnemonic (seed or phrase)', 'Loaded from unified spending key'):
            raise ValueError('Wallet has no verified spending authority')
        os.environ['SHADOWBID_ZINGO_INVOICE_CLI'] = str(sender)
        proposal = command('send', rows[0]['address'], rows[0]['amount_zats'])
        fee = worker.integer(proposal['fee'])
        if balance['spendable_balance'] < int(rows[0]['amount_zats']) + fee:
            raise ValueError('Insufficient spendable balance')
    report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'network': 'testnet',
              'wallet_kind': kind['kind'], 'confirmed_spendable_zats': balance['spendable_balance'],
              'invoice_a_address': rows[0]['address'], 'amount_zats': rows[0]['amount_zats'],
              'fee_zats': fee, 'deadline': rows[0]['deadline'], 'confirmations_required': 3,
              'distinct_owned_receivers': True, 'invoice_b_unpaid': True,
              'wallet_height': height, 'active_chain_height': tip,
              'sender_sha256': sender_hash,
              'proposal_only': True, 'broadcast_authorized': False}
    worker.atomic_private(ROOT / '.env.invoice-experiment/payment-preflight.json', report)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError, KeyError):
        # Subprocess errors can contain private RPC or database context.
        print('Payment preflight did not pass. No transaction signed or broadcast; private diagnostics require review.')
        raise SystemExit(1) from None
