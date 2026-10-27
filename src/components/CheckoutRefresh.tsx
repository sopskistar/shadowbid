'use client';

import {useEffect,useTransition} from 'react';
import {useRouter} from 'next/navigation';

export function CheckoutRefresh({monitoring}:{monitoring:boolean}){
  const router=useRouter();
  const [pending,startTransition]=useTransition();
  useEffect(()=>{
    if(!monitoring)return;
    const timer=setInterval(()=>{
      if(document.visibilityState==='visible')router.refresh();
    },15000);
    return ()=>clearInterval(timer);
  },[monitoring,router]);
  return <button className="btn secondary small" disabled={pending}
    onClick={()=>startTransition(()=>router.refresh())}>
    {pending?'Checking payment…':'Refresh payment status'}
  </button>;
}
