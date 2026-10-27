import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('approved_send', ROOT / 'scripts/send-approved-invoice.py')
sender = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sender)


class ApprovalTests(unittest.TestCase):
    def setUp(self):
        self.approval = {'network':'testnet','transactions':1,'amount_zats':1000000,
                         'max_fee_zats':10000,'max_total_zats':1010000,'receiver':'utest1synthetic'}
        self.quote = {'network':'testnet','invoice_a_address':'utest1synthetic',
                      'amount_zats':'1000000','fee_zats':10000}
        self.rows = [{'network':'testnet','amount_zats':amount,'paid_zats':'0','status':'awaiting',
                      'notes':[],'deadline':'2099-01-01T00:00:00Z','address':address}
                     for amount,address in [('1000000','utest1synthetic'),('2000000','utest1other')]]
        self.txid = 'a'*64
        self.groups = {p+'_notes':{'note_summaries':[]} for p in ('ironwood','orchard','sapling')}
        self.groups['ironwood_notes']['note_summaries'] = [
            {'txid':'b'*64,'spend_status':'calculated spent in '+self.txid,'value':100000000,'account_id':0},
            {'txid':self.txid,'spend_status':'unspent','value':1000000,'account_id':0,
             'scope':'external','recipient_unified_address':'utest1synthetic','output_index':0},
            {'txid':self.txid,'spend_status':'unspent','value':98990000,'account_id':0,
             'scope':'internal','recipient_unified_address':None,'output_index':1},
        ]

    def test_exact_approved_self_transfer_and_fee(self):
        sender.validate_approval(self.approval,self.rows,self.quote)
        self.assertEqual(sender.validate_calculated(self.groups,self.txid,self.approval,10000)['fee_zats'],10000)

    def test_changed_receiver_network_amount_or_fee_stops(self):
        for key,value in [('network','mainnet'),('invoice_a_address','utest1other'),('amount_zats','1000001'),('fee_zats',10001)]:
            with self.subTest(key=key),self.assertRaises(ValueError):
                sender.validate_approval(self.approval,self.rows,{**self.quote,key:value})

    def test_expiry_or_existing_payment_stops(self):
        for field,value in [('deadline','2000-01-01T00:00:00Z'),('paid_zats','1'),('status','confirmed'),('notes',[{}])]:
            rows=copy.deepcopy(self.rows);rows[0][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):
                sender.validate_approval(self.approval,rows,self.quote)

    def test_calculated_receiver_amount_or_fee_mismatch_stops(self):
        for field,value in [('value',1000001),('recipient_unified_address','utest1other'),('scope','internal')]:
            groups=copy.deepcopy(self.groups);groups['ironwood_notes']['note_summaries'][1][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):
                sender.validate_calculated(groups,self.txid,self.approval,10000)
        groups=copy.deepcopy(self.groups);groups['ironwood_notes']['note_summaries'][2]['value']-=1
        with self.assertRaises(ValueError):sender.validate_calculated(groups,self.txid,self.approval,10000)

    def test_extra_output_or_wrong_pool_stops(self):
        groups=copy.deepcopy(self.groups)
        groups['ironwood_notes']['note_summaries'].append(copy.deepcopy(groups['ironwood_notes']['note_summaries'][1]))
        with self.assertRaises(ValueError):sender.validate_calculated(groups,self.txid,self.approval,10000)
        groups=copy.deepcopy(self.groups)
        groups['sapling_notes']['note_summaries']=groups['ironwood_notes']['note_summaries']
        groups['ironwood_notes']['note_summaries']=[]
        with self.assertRaises(ValueError):sender.validate_calculated(groups,self.txid,self.approval,10000)

    def test_resume_only_never_transmitted_exact_saved_transaction(self):
        state={'stage':'calculated_not_broadcast','approval':self.approval,
               'sender_sha256':'reviewed','txid':self.txid,'fee_zats':10000}
        for n in self.groups['ironwood_notes']['note_summaries']:
            if n['txid']==self.txid:n['status']='calculated at block height 123'
        sender.validate_resume(state,self.approval,'reviewed',self.groups)
        for field,value in [('stage','preparing'),('stage','broadcast_attempted'),
                            ('stage','broadcast_accepted'),('attempted_at','any'),
                            ('accepted_at','any'),('sender_sha256','changed'),
                            ('fee_zats',10001),('txid','invalid'),('approval',{})]:
            with self.subTest(field=field,value=value),self.assertRaises(ValueError):
                sender.validate_resume({**state,field:value},self.approval,'reviewed',self.groups)
        self.groups['ironwood_notes']['note_summaries'][1]['status']='transmitted at block height 123'
        with self.assertRaises(ValueError):
            sender.validate_resume(state,self.approval,'reviewed',self.groups)


if __name__ == '__main__':unittest.main()
