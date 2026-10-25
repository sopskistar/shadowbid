'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {Menu,X} from 'lucide-react';
import {Logout} from './Logout';
const links=[['Explore Auctions','/auctions'],['How It Works','/#how'],['Why Privacy','/#privacy'],['FAQ','/faq'],['Roadmap','/roadmap'],['Documentation','/docs']];
const accountLinks=[['Account','/dashboard'],['My Auctions','/dashboard/auctions'],['My Bids','/dashboard/bids']];
export function Nav({authenticated}:{authenticated:boolean}){
  const [open,setOpen]=useState(false),reduced=useReducedMotion();
  return <header className={authenticated?"nav authenticated-nav":"nav"}><div className="container nav-inner"><Link className="brand" href="/"><Image src="/shadowbid-icon.png" alt="" width={40} height={40}/>ShadowBid</Link><nav className="navlinks" aria-label="Primary">{(authenticated?links.slice(0,1):links).map(([label,href])=><Link key={label} href={href}>{label}</Link>)}</nav><div className="nav-actions">{authenticated?<><Link className="desktop-account-link" href="/dashboard">Account</Link><Link className="desktop-account-link" href="/dashboard/auctions">My Auctions</Link><Link className="desktop-account-link" href="/dashboard/bids">My Bids</Link><span className="desktop-account-link"><Logout/></span></>:<Link href="/login">Sign In</Link>}<Link className="btn small" href="/auctions">Launch Marketplace</Link><button className="hamburger" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div><AnimatePresence>{open&&<motion.nav className="mobile-menu" aria-label="Mobile" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:reduced?0:.25}}>{links.map(([label,href])=><Link onClick={()=>setOpen(false)} key={label} href={href}>{label}</Link>)}{authenticated?<>{accountLinks.map(([label,href])=><Link onClick={()=>setOpen(false)} key={label} href={href}>{label}</Link>)}<Logout onSuccess={()=>setOpen(false)}/></>:<Link onClick={()=>setOpen(false)} href="/login">Sign In</Link>}</motion.nav>}</AnimatePresence></header>;
}
