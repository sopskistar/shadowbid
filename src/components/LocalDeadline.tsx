'use client';

import {useEffect,useState} from 'react';

export function LocalDeadline({iso}:{iso:string}){
  const [local,setLocal]=useState('');
  useEffect(()=>{
    const timer=setTimeout(()=>setLocal(new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(iso))),0);
    return()=>clearTimeout(timer);
  },[iso]);
  const utc=new Date(iso).toLocaleString('en-US',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'});
  return <span className="deadline-times"><time dateTime={iso}>{utc} UTC</time>{local&&<small>Your local time: {local}</small>}</span>;
}
