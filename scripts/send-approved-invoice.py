#!/usr/bin/env python3
"""Execute one explicitly approved local public-testnet invoice transfer.

Requires the operator's approval file, exclusive wallet access, current real
observations, and the previously tested sender hash. A durable attempt record
prevents rerunning this command after signing or an uncertain transmission.
"""
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import select
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('preflight', ROOT / 'scripts/prepare-invoice-payment.py')
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)
worker, receiver = preflight.worker, preflight.receiver


def validate_approval(approval, rows, quote):
    if (approval['network'] != 'testnet' or approval['transactions'] != 1
            or approval['amount_zats'] != 1000000 or approval['max_fee_zats'] != 10000
            or approval['max_total_zats'] != 1010000):
        raise ValueError('Approval differs from the single invoice-A test')
    if len(rows) != 2 or rows[0]['address'] == rows[1]['address']:
        raise ValueError('Distinct A/B invoices required')
    for index, row in enumerate(rows):
        if (row['network'] != 'testnet' or row['amount_zats'] != ('1000000', '2000000')[index]
                or row['paid_zats'] != '0' or row['status'] != 'awaiting' or row['notes']):
            raise ValueError('Invoice state differs from approval')
        if datetime.fromisoformat(row['deadline'].replace('Z', '+00:00')) <= datetime.now(timezone.utc):
            raise ValueError('Invoice expired')
    if (rows[0]['address'] != approval['receiver'] or quote['invoice_a_address'] != approval['receiver']
            or quote['network'] != approval['network'] or int(quote['amount_zats']) != approval['amount_zats']
            or quote['fee_zats'] > approval['max_fee_zats']):
        raise ValueError('Receiver, network, amount or fee differs from approval')


def validate_calculated(groups, txid, approval, fee):
    notes = [(pool, n) for pool in ('ironwood', 'orchard', 'sapling')
             for n in groups[pool + '_notes']['note_summaries']]
    received = [(pool, n) for pool, n in notes if n['txid'] == txid]
    inputs = [(pool, n) for pool, n in notes if n['spend_status'] == 'calculated spent in ' + txid]
    payment = [n for pool, n in received if n.get('recipient_unified_address') == approval['receiver']]
    change = [n for pool, n in received if n['scope'] == 'internal']
    if (len(payment) != 1 or payment[0]['value'] != approval['amount_zats']
            or payment[0]['scope'] != 'external' or len(change) != 1 or len(received) != 2
            or any(pool != 'ironwood' or n['account_id'] != 0 for pool, n in received + inputs)
            or len(inputs) != 1):
        raise ValueError('Calculated shielded outputs or input differ from approval')
    actual_fee = sum(n['value'] for _, n in inputs) - sum(n['value'] for _, n in received)
    if (actual_fee != fee or not 0 <= fee <= approval['max_fee_zats']
            or approval['amount_zats'] + fee > approval['max_total_zats']):
        raise ValueError('Calculated fee or payment debit exceeds approval')
    return {'payment_output_index': payment[0]['output_index'], 'fee_zats': actual_fee,
            'change_zats': change[0]['value'], 'pool': 'ironwood'}


def validate_resume(state, approval, sender_hash, groups=None):
    """Only resume a known signed transaction that never reached transmission."""
    if (state.get('stage') != 'calculated_not_broadcast'
            or 'attempted_at' in state or 'accepted_at' in state
            or state.get('approval') != approval or state.get('sender_sha256') != sender_hash
            or not re.fullmatch(r'[a-f0-9]{64}', state.get('txid', ''))
            or type(state.get('fee_zats')) is not int
            or not 0 <= state['fee_zats'] <= approval['max_fee_zats']):
        raise ValueError('Only the exact saved, never-transmitted transaction may resume')
    if groups is not None:
        validate_calculated(groups, state['txid'], approval, state['fee_zats'])
        outputs = [n for pool in ('ironwood', 'orchard', 'sapling')
                   for n in groups[pool + '_notes']['note_summaries'] if n['txid'] == state['txid']]
        if any(not re.fullmatch(r'calculated at block height \d+', n.get('status', '')) for n in outputs):
            raise ValueError('Saved transaction is no longer exclusively calculated')


class Session:
    def __init__(self, args, diagnostic):
        self.log = diagnostic.open('xb')
        os.fchmod(self.log.fileno(), 0o600)
        self.process = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=self.log, bufsize=0)
        self.buffer = ''

    def command(self, command, timeout=180):
        self.process.stdin.write((command + '\n').encode())
        self.process.stdin.flush()
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            self.buffer = self.buffer.lstrip()
            if self.buffer:
                try:
                    result, end = json.JSONDecoder().raw_decode(self.buffer)
                    self.buffer = self.buffer[end:]
                    return result
                except json.JSONDecodeError:
                    pass
            ready, _, _ = select.select([self.process.stdout], [], [], min(1, max(0, deadline-time.monotonic())))
            if ready:
                raw = os.read(self.process.stdout.fileno(), 65536)
                if not raw:
                    raise RuntimeError('Sender exited before its response')
                self.buffer += raw.decode()
                if len(self.buffer) > 1000000:
                    raise RuntimeError('Unexpected sender output')
        raise RuntimeError('Sender response timed out; inspect saved attempt before any retry')

    def close(self):
        try:
            if self.process.poll() is None:
                self.process.stdin.write(b'quit\n')
                self.process.stdin.flush()
                self.process.communicate(timeout=30)
        except (OSError, subprocess.TimeoutExpired):
            subprocess.run(['docker', 'stop', '--time', '20', 'shadowbid-approved-invoice-a-sender'],
                           capture_output=True, timeout=30, check=True)
            self.process.wait(timeout=30)
        finally:
            self.log.close()


def read_rows():
    query = preflight.acceptance.READ_ROWS.replace('network,status,amount_zats', 'network,status,deadline,amount_zats')
    result = subprocess.run(['node', '--input-type=module', '-e', query],
                            check=True, capture_output=True, text=True, timeout=30)
    return json.loads(result.stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--approval', required=True, type=Path)
    parser.add_argument('--resume-calculated', action='store_true',
                        help='Resume only the exact durable calculated_not_broadcast transaction; never signs again')
    args = parser.parse_args()
    os.chdir(ROOT)
    os.umask(0o077)
    if args.approval.stat().st_mode & 0o077:
        raise ValueError('Approval file must be private')
    approval = json.loads(args.approval.read_text())
    config = worker.load_config(ROOT / '.env.invoice-experiment/worker.json')
    quote = json.loads((ROOT / '.env.invoice-experiment/payment-preflight.json').read_text())
    sender = ROOT / '.env.nu7-receiver/bin/zingo-send-cli'
    with sender.open('rb') as binary:
        if hashlib.file_digest(binary, 'sha256').hexdigest() != quote['sender_sha256']:
            raise ValueError('Sender hash differs from the tested proposal')
    os.environ['SHADOWBID_ZINGO_INVOICE_CLI'] = str(ROOT / '.env.nu7-receiver/bin/zingo-invoice-cli')
    directory = receiver.WALLET / 'invoices'
    attempt_path = ROOT / '.env.invoice-experiment/approved-send-attempt.json'
    if attempt_path.exists() and not args.resume_calculated:
        raise ValueError('Prior attempt exists; inspect it before any further action')
    with (directory / 'worker.lock').open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = None
        if args.resume_calculated:
            state = json.loads(attempt_path.read_text())
            validate_resume(state, approval, quote['sender_sha256'])
        rows = read_rows()
        validate_approval(approval, rows, quote)
        for row in rows:
            binding = json.loads((directory / (row['id'] + '.json')).read_text())
            if row['address'] != binding['address'] or row['wallet_account'] != binding['binding_id']:
                raise ValueError('Persisted receiver binding differs')
        if state is None:
            worker.tick(config, rows[0]['id'], directory)
        with receiver.paused_wallet() as image:
            height, notes, addresses = receiver.scan_snapshot(image)
            tip, _, active = receiver.active_notes(notes, height)
            funding = [n for n in active if n['height'] is not None]
            if (len(funding) != 1 or funding[0]['pool'] != 'ironwood' or funding[0]['value_zats'] != 100000000
                    or funding[0]['confirmations'] < 3 or approval['receiver'] not in {a['encoded_address'] for a in addresses}
                    or (state is None and len(active) != 1)):
                raise ValueError('Funded wallet state differs from the approved preflight')
            stamp = str(time.time_ns())
            worker.backup_wallet(directory / ('wallet-before-approved-send-' + stamp + '.dat'))
            if state is None:
                state = {'stage': 'preparing', 'started_at': datetime.now(timezone.utc).isoformat(),
                     'approval': approval, 'wallet_height': height, 'zebra_tip': tip,
                     'sender_sha256': quote['sender_sha256']}
                with attempt_path.open('x') as out:
                    json.dump(state, out);out.flush();os.fsync(out.fileno())
            scanner = json.loads(receiver.docker('inspect', receiver.CONTAINER))[0]
            host_mapping = scanner['HostConfig']['ExtraHosts']
            if len(host_mapping) != 1 or not re.fullmatch(r'testnet\.zec\.rocks:\d+\.\d+\.\d+\.\d+',host_mapping[0]):
                raise ValueError('Scanner endpoint mapping changed')
            command = ['docker','run','--rm','-i','--name','shadowbid-approved-invoice-a-sender',
                       '--network','host','--add-host',host_mapping[0],'--user','1000:1000',
                       '--read-only','--cap-drop','ALL','--tmpfs','/tmp:rw,nosuid,nodev,mode=1777',
                       '--mount',f'type=bind,src={receiver.WALLET},dst=/wallet',
                       '--mount',f'type=bind,src={sender},dst=/sender,readonly','--entrypoint','/sender',
                       image,'--chain','testnet','--data-dir','/wallet','--nosync',
                       '--server','https://testnet.zec.rocks:443','--nym-proxy','/src/target/release/nym-proxy']
            log_name = ('approved-resume-' + stamp + '.log') if args.resume_calculated else 'approved-send-stderr.log'
            session = Session(command, ROOT / '.env.invoice-experiment' / log_name)
            try:
                owned = session.command('check_address ' + approval['receiver'])
                if str(owned.get('is_wallet_address')).lower() != 'true':
                    raise ValueError('Sender does not own the approved receiver')
                if args.resume_calculated:
                    txid, fee = state['txid'], state['fee_zats']
                    if fee != quote['fee_zats']:
                        raise ValueError('Saved fee differs from reviewed quote')
                else:
                    balance = session.command('spendable_balance')['spendable_balance']
                    if balance < approval['max_total_zats']:
                        raise ValueError('Spendable balance insufficient')
                    proposal = session.command(f"send {approval['receiver']} {approval['amount_zats']}")
                    fee = proposal['fee']
                    if type(fee) is not int or fee != quote['fee_zats'] or fee > approval['max_fee_zats']:
                        raise ValueError('Proposed fee changed')
                    calculated = session.command('calculate')
                    txids = calculated['txids']
                    if len(txids) != 1 or not re.fullmatch(r'[a-f0-9]{64}', txids[0]):
                        raise ValueError('Expected exactly one calculated transaction')
                    txid = txids[0]
                    state.update(stage='calculated_not_broadcast',txid=txid,fee_zats=fee)
                    worker.atomic_private(attempt_path,state)
                groups = session.command('notes all')
                checked = validate_calculated(groups,txid,approval,fee)
                if args.resume_calculated:
                    validate_resume(state, approval, quote['sender_sha256'], groups)
                validate_approval(approval,read_rows(),quote)
                receiver.active_notes(notes,height)
                state.update(stage='broadcast_attempted',calculated_output_check=checked,
                             attempted_at=datetime.now(timezone.utc).isoformat())
                worker.atomic_private(attempt_path,state)
                print('Validated approved network, recipient, amount, fee and decrypted calculated outputs. Transmitting one transaction.',flush=True)
                response = session.command('transmit ' + txid,timeout=240)
                if response.get('txids') != [txid]:
                    raise RuntimeError('Transmission response differs; inspect recorded transaction')
                state.update(stage='broadcast_accepted',accepted_at=datetime.now(timezone.utc).isoformat())
                worker.atomic_private(attempt_path,state)
                print(json.dumps({'broadcast_accepted':True,'txid':txid,'amount_zats':approval['amount_zats'],'fee_zats':fee}),flush=True)
            except (ValueError, RuntimeError, OSError, subprocess.SubprocessError, KeyError) as error:
                worker.atomic_private(ROOT / '.env.invoice-experiment' / ('approved-failure-' + stamp + '.json'),
                                      {'stage': state['stage'], 'error_type': type(error).__name__,
                                       'error': str(error), 'recorded_at': datetime.now(timezone.utc).isoformat()})
                raise
            finally:
                session.close()
                worker.backup_wallet(directory / ('wallet-after-approved-send-' + stamp + '.dat'))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError, KeyError):
        print('Transfer stopped. Inspect the protected attempt record before any retry; no automatic second transaction is allowed.')
        raise SystemExit(1) from None
