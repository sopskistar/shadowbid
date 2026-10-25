'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

const verificationHint="Check your inbox for your verification link. If you don't see it within a few minutes, check your Spam or Junk folder.";

export function AuthForm({mode}:{mode:'login'|'signup'}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[pendingVerification,setPendingVerification]=useState(false);
  const router=useRouter();
  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});const j=await r.json();if(!r.ok)throw Error(j.error);
      if(mode==='signup'&&(!j.created||j.pendingVerification)){setPendingVerification(!!j.pendingVerification);setMessage(j.pendingVerification?verificationHint:j.message);return;}
      router.push('/dashboard');router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Could not sign in')}finally{setBusy(false)}
  }
  async function resend(){
    setBusy(true);setError('');setMessage('');
    try{const r=await fetch('/api/auth/resend-verification',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});const j=await r.json();if(!r.ok)throw Error(j.error);setMessage(j.message);}
    catch(e){setError(e instanceof Error?e.message:'Could not resend verification email.')}finally{setBusy(false)}
  }
  return <form className="form panel card" onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" minLength={12} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="notice error" role="alert">{error}</div>}{message&&<div className="notice" role="status">{message}</div>}<button className="btn" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':'Sign in'}</button>{mode==='signup'&&pendingVerification&&<button className="btn secondary" type="button" disabled={busy} onClick={resend}>Resend verification email</button>}</form>;
}
