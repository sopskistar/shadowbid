"""Synthetic failure tests; none of these fixtures are payment evidence."""
import copy
from datetime import datetime, timedelta, timezone
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("invoice_experiment", ROOT / "scripts/receiver-invoices.py")
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class MonitorTests(unittest.TestCase):
    def setUp(self):
        self.binding = {"address": "utest1syntheticreceiver", "wallet_account_id": 0, "address_index": 1}
        self.note = {"pool": "ironwood", "recipient_unified_address": self.binding["address"],
            "scope": "external", "account_id": 0, "txid": "a" * 64, "output_index": 0,
            "value_zats": 1_000_000, "height": 100, "confirmations": 3}
        self.snapshot = {"schema_version": 2, "chain": "test", "recipient_metadata": True,
            "receiver_owned": True, "observed_at": datetime.now(timezone.utc).isoformat(),
            "zebra_tip": 102, "wallet_height": 102, "zebra_tip_hash": "b" * 64,
            "owned_addresses": [{"encoded_address": self.binding["address"], "account": 0,
                "address_index": 1, "has_orchard": True, "has_transparent": False}],
            "notes": [self.note]}

    def test_exact_amounts_and_partial_overpayments_remain_exact(self):
        for value in (1, 499_999, 1_000_000, 1_000_001):
            self.note["value_zats"] = value
            result = worker.match_notes(self.snapshot, self.binding)
            self.assertEqual(result[0]["amountZats"], str(value))
            self.assertEqual(result[0]["confirmations"], 3)

    def test_wrong_recipient_is_never_routed_by_txid_or_account(self):
        self.note["recipient_unified_address"] = "utest1anotherreceiver"
        self.assertEqual(worker.match_notes(self.snapshot, self.binding), [])

    def test_two_receivers_in_same_transaction_are_isolated(self):
        second = {**self.binding, "address": "utest1secondsynthetic", "address_index": 2}
        self.snapshot["owned_addresses"].append({**self.snapshot["owned_addresses"][0],
            "encoded_address": second["address"], "address_index": 2})
        self.snapshot["notes"].append({**self.note, "recipient_unified_address": second["address"],
            "output_index": 1, "value_zats": 2_000_000})
        self.assertEqual([n["amountZats"] for n in worker.match_notes(self.snapshot, self.binding)], ["1000000"])
        self.assertEqual([n["amountZats"] for n in worker.match_notes(self.snapshot, second)], ["2000000"])

    def test_unknown_recipient_and_unmined_note_never_confirm_payment(self):
        self.note["recipient_unified_address"] = None
        self.assertEqual(worker.match_notes(self.snapshot, self.binding), [])
        self.note.update(recipient_unified_address=self.binding["address"], height=None, confirmations=0)
        self.assertEqual(worker.match_notes(self.snapshot, self.binding)[0]["confirmations"], 0)

    def test_duplicate_notes_are_rejected(self):
        self.snapshot["notes"].append(copy.deepcopy(self.note))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            worker.match_notes(self.snapshot, self.binding)

    def test_pool_and_scope_are_not_interchangeable(self):
        for field, value in (("pool", "orchard"), ("scope", "internal"), ("account_id", 1)):
            snapshot = copy.deepcopy(self.snapshot)
            snapshot["notes"][0][field] = value
            with self.assertRaises(ValueError):
                worker.match_notes(snapshot, self.binding)

    def test_stale_unsynced_or_wrong_network_snapshots_fail_closed(self):
        for field, value in (("chain", "main"), ("wallet_height", 90), ("recipient_metadata", False),
                ("observed_at", (datetime.now(timezone.utc) - timedelta(minutes=2)).isoformat())):
            snapshot = copy.deepcopy(self.snapshot)
            snapshot[field] = value
            with self.assertRaises(ValueError):
                worker.match_notes(snapshot, self.binding)

    def test_forged_confirmation_count_and_float_amount_rejected(self):
        for field, value in (("confirmations", 4), ("value_zats", 1.5), ("value_zats", True)):
            snapshot = copy.deepcopy(self.snapshot)
            snapshot["notes"][0][field] = value
            with self.assertRaises(ValueError):
                worker.match_notes(snapshot, self.binding)

    def test_receiver_must_survive_wallet_reload_at_same_index(self):
        self.snapshot["owned_addresses"][0]["address_index"] = 2
        with self.assertRaisesRegex(ValueError, "ownership"):
            worker.match_notes(self.snapshot, self.binding)

    def test_active_chain_reorg_removes_note_from_snapshot(self):
        def rpc(method, params=None):
            if method == "getblockchaininfo":
                return {"chain": "test", "blocks": 102}
            if method == "getblockhash":
                return "b" * 64 if params[0] == 102 else "c" * 64
            return {"hash": "c" * 64, "tx": ["d" * 64]}
        with patch.object(worker.receiver, "rpc", side_effect=rpc):
            _, _, notes = worker.receiver.active_notes([self.note], 102)
        self.assertEqual(notes, [])

    def test_reorg_during_observation_fails_closed(self):
        tip_calls = 0
        def rpc(method, params=None):
            nonlocal tip_calls
            if method == "getblockchaininfo":
                return {"chain": "test", "blocks": 102}
            if method == "getblockhash" and params[0] == 102:
                tip_calls += 1
                return ("b" if tip_calls == 1 else "e") * 64
            if method == "getblockhash":
                return "c" * 64
            return {"hash": "c" * 64, "tx": [self.note["txid"]]}
        with patch.object(worker.receiver, "rpc", side_effect=rpc):
            with self.assertRaisesRegex(RuntimeError, "changed"):
                worker.receiver.active_notes([self.note], 102)

    def test_production_app_config_is_forbidden(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "worker.json"
            path.write_text(json.dumps({"app_url": "https://shadowbid-ashy.vercel.app", "worker_secret": "x" * 32}))
            path.chmod(0o600)
            with self.assertRaisesRegex(ValueError, "loopback"):
                worker.load_config(path)

    def test_private_binding_survives_reload_without_exposing_secret(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "binding.json"
            worker.atomic_private(path, self.binding)
            self.assertEqual(json.loads(path.read_text()), self.binding)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_restart_reuses_binding_and_retries_interrupted_assignment(self):
        config = {"app_url": "http://127.0.0.1:3101"}
        invoice = {"id": "test-invoice", "amountZats": "1000000", "address": None}
        binding = {**self.binding, "invoice_id": invoice["id"], "app_url": config["app_url"],
            "amount_zats": "1000000", "network": "testnet", "binding_id": "stable-binding"}
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            worker.atomic_private(directory / 'test-invoice.json', binding)
            with patch.object(worker.receiver, 'wallet_command') as wallet, patch.object(worker, 'api') as api:
                self.assertEqual(worker.assign(config, invoice, directory), binding)
                api.assert_called_once_with(config, '/api/worker/assign', {
                    'id': invoice['id'], 'walletAccount': 'stable-binding', 'address': binding['address']})
                invoice.update(address=binding['address'], walletAccount='stable-binding')
                api.reset_mock()
                self.assertEqual(worker.assign(config, invoice, directory), binding)
                api.assert_not_called()
                wallet.assert_not_called()

    def test_restart_rejects_changed_invoice_association(self):
        config = {"app_url": "http://127.0.0.1:3101"}
        invoice = {"id": "test-invoice", "amountZats": "1000000", "address": self.binding["address"],
            "walletAccount": "binding"}
        binding = {**self.binding, "invoice_id": invoice["id"], "app_url": config["app_url"],
            "amount_zats": "1000000", "network": "testnet", "binding_id": "binding"}
        for field, value in (("address", "another-receiver"), ("walletAccount", "another-binding"),
                ("amountZats", "2000000"), ("id", "another-invoice")):
            with self.subTest(field=field), self.assertRaises(ValueError):
                worker.validate_binding(binding, config, {**invoice, field: value})


if __name__ == "__main__":
    unittest.main()
