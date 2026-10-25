'use client';
import {useEffect,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';

export function PhaseTimeline({biddingEndsAt,revealEndsAt,serverNow}:{biddingEndsAt:string;revealEndsAt:string;serverNow?:string}){
  const [now,setNow]=useState(serverNow?Date.parse(serverNow):0);
  const reduced=useReducedMotion();
  useEffect(()=>{const baseline=Date.now(),origin=serverNow?Date.parse(serverNow):baseline;const initial=setTimeout(()=>setNow(origin),0);const timer=setInterval(()=>setNow(origin+Date.now()-baseline),15000);return()=>{clearTimeout(initial);clearInterval(timer)}},[serverNow]);
  const current=now<Date.parse(biddingEndsAt)?0:now<Date.parse(revealEndsAt)?1:2;
  return <div className="phase-timeline auction-phase-timeline" aria-label="Auction phase progress">{[['01','Sealed bidding','Commit privately'],['02','Reveal window','Verify receipts'],['03','Settlement','Private invoice']].map(([number,label,detail],index)=><motion.div key={label} className={index===current?'active':index<current?'done':''} initial={{opacity:0,y:reduced?0:10}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.4,delay:reduced?0:index*.08}} aria-current={index===current?'step':undefined}><span>{number}</span><strong>{label}</strong><small>{detail}</small></motion.div>)}</div>;
}
