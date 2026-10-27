#!/usr/bin/env python3
"""Verify the preserved two-invoice experiment using fresh real wallet observations.

Requires the local experiment app to be running. Never sends funds, assigns
receivers, changes deadlines, or supplies synthetic notes. A missing payment
is a failing acceptance gate, not a successful test.
"""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import traceback

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('receiver_invoices', ROOT / 'scripts/receiver-invoices.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


def verify_paid_fixture(snapshot, bindings, rows):
    """Check wallet evidence against persisted records, without leaking identifiers."""
    if len(bindings) != 2 or len(rows) != 2:
        raise ValueError('Exactly two preserved test invoices are required')
    if bindings[0]['address'] == bindings[1]['address']:
        raise ValueError('Invoice receivers are not distinct')
    identities = []
    for index, (binding, row) in enumerate(zip(bindings, rows)):
        expected = ('1000000', '2000000')[index]
        if binding['amount_zats'] != expected or row['amount_zats'] != expected:
            raise ValueError('Unexpected invoice amount')
        if (row['id'] != binding['invoice_id'] or row['address'] != binding['address']
                or row['wallet_account'] != binding['binding_id'] or row['network'] != 'testnet'):
            raise ValueError('Persisted invoice-to-receiver mapping differs')
        notes = worker.match_notes(snapshot, binding)
        recorded = row['notes']
        if index == 0:
            if (not notes or any(n['confirmations'] < 3 for n in notes)
                    or sum(int(n['amountZats']) for n in notes) != int(expected)):
                raise ValueError('Invoice A lacks an exact real payment with three confirmations')
            if row['status'] != 'confirmed' or row['paid_zats'] != expected:
                raise ValueError('Invoice A has not persisted the verified paid amount')
            wanted = sorted((n['txid'], n['outIndex'], n['amountZats']) for n in notes)
            actual = sorted((n['txid'], n['out_index'], n['amount_zats']) for n in recorded)
            if wanted != actual or any(n['confirmations'] < 3 for n in recorded):
                raise ValueError('Database notes differ from decrypted wallet notes')
            identities.append(actual)
        elif notes or recorded or row['paid_zats'] != '0' or row['status'] != 'awaiting':
            raise ValueError('Invoice B must remain unpaid and have no received notes')
    return identities


READ_ROWS = r"""
import {readFile} from 'node:fs/promises';
import postgres from 'postgres';
const c=JSON.parse(await readFile('.env.invoice-experiment/worker.json','utf8'));
const u=new URL(c.database_url);
if(u.hostname!=='127.0.0.1'||u.pathname!=='/shadowbid_invoice_experiment')throw Error('Wrong target');
const f=JSON.parse(await readFile('.env.invoice-experiment/fixture.json','utf8'));
const sql=postgres(c.database_url,{max:1});
try {
 const rows=[];
 for(const item of f.invoices){
  const [r]=await sql`select id,address,wallet_account,network,status,amount_zats::text,paid_zats::text from invoices where id=${item.id}`;
  if(!r)throw Error('Missing fixture');
  r.notes=await sql`select txid,out_index,amount_zats::text,confirmations from payment_notes where invoice_id=${item.id} order by txid,out_index`;
  rows.push(r);
 }
 console.log(JSON.stringify(rows));
} finally {await sql.end();}
"""


def main():
    os.umask(0o077)
    os.chdir(ROOT)
    worker.load_config(ROOT / '.env.invoice-experiment/worker.json')
    fixture = json.loads((ROOT / '.env.invoice-experiment/fixture.json').read_text())
    bindings = [json.loads((worker.receiver.WALLET / 'invoices' / (i['id'] + '.json')).read_text())
                for i in fixture['invoices']]
    evidence = []
    for phase in ('initial', 'new_worker_process'):
        # Each subprocess reloads the wallet, binding files, app state and HMAC
        # credentials. tick() reconciles both invoices before reporting health.
        subprocess.run([sys.executable, 'scripts/run-invoice-experiment.py', 'observe'],
                       check=True, capture_output=True, timeout=180)
        snapshot = json.loads((worker.receiver.WALLET / 'observations.jsonl').read_text().splitlines()[-1])
        result = subprocess.run(['node', '--input-type=module', '-e', READ_ROWS],
                                check=True, capture_output=True, text=True, timeout=30)
        rows = json.loads(result.stdout)
        identities = verify_paid_fixture(snapshot, bindings, rows)
        evidence.append({'phase': phase, 'observed_at': snapshot['observed_at'],
                         'tip': snapshot['zebra_tip'], 'identities': identities})
        if len(evidence) == 1:
            time.sleep(3)
    if evidence[0]['identities'] != evidence[1]['identities']:
        raise ValueError('Payment identities changed across worker restart')
    report = {'verified_at': evidence[-1]['observed_at'], 'network': 'testnet',
              'invoice_a_zats': '1000000', 'invoice_b_zats': '0',
              'worker_process_restart_no_duplicate_notes': True, 'evidence': evidence,
              'authorization_browser_check_required': True,
              'production_activation_authorized': False}
    directory = ROOT / '.env.invoice-experiment'
    worker.atomic_private(directory / ('paid-acceptance-' + str(time.time_ns()) + '.json'), report)
    print('PASS: fresh decrypted invoice A payment, exact zatoshis, >=3 confirmations, '
          'invoice B unpaid, and no duplicated notes after a new worker process. '
          'Run the separate checkout authorization check; production remains disabled.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError, KeyError) as error:
        # Retain the reason without exposing command arguments, invoice IDs,
        # credentials, wallet output or database responses on the terminal.
        diagnostic = {'type': type(error).__name__, 'traceback': traceback.format_exc()}
        if isinstance(error, subprocess.CalledProcessError):
            diagnostic.update(returncode=error.returncode,
                stdout=(error.stdout or b'').decode(errors='replace') if isinstance(error.stdout, bytes) else error.stdout,
                stderr=(error.stderr or b'').decode(errors='replace') if isinstance(error.stderr, bytes) else error.stderr)
        directory = ROOT / '.env.invoice-experiment'
        if directory.is_dir():
            worker.atomic_private(directory / ('settlement-failure-' + str(time.time_ns()) + '.json'), diagnostic)
        print('NOT VERIFIED: the current payment/restart gate failed; prior payment evidence is preserved. '
              'Inspect the protected settlement-failure diagnostic and monitoring health. '
              'Do not send another payment.')
        raise SystemExit(1) from None
