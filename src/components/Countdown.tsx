'use client';
import {useEffect,useState} from 'react';
export function Countdown({biddingEndsAt,revealEndsAt,serverNow}:{biddingEndsAt:string,revealEndsAt:string,serverNow?:string}){
  const [now,setNow]=useState(serverNow?Date.parse(serverNow):0);
  useEffect(()=>{const baseline=Date.now(),origin=serverNow?Date.parse(serverNow):baseline;const initial=setTimeout(()=>setNow(origin),0);const timer=setInterval(()=>setNow(origin+Date.now()-baseline),1000);return()=>{clearTimeout(initial);clearInterval(timer)}},[serverNow]);
  if(!now)return <strong>Loading countdown…</strong>;
  const bid=Date.parse(biddingEndsAt),reveal=Date.parse(revealEndsAt),target=now<bid?bid:reveal,label=now<bid?'Bidding':now<reveal?'Reveal':'Closed';
  if(now>=reveal)return <strong>Window closed</strong>;
  const s=Math.max(0,Math.floor((target-now)/1000));return <strong>{label} · {Math.floor(s/3600)}h {Math.floor(s%3600/60)}m {s%60}s</strong>;
}
