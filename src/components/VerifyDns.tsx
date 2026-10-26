'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

export function VerifyDns({id,domain,challenge}:{id:string;domain:string;challenge:string|null}){
  const router=useRouter();
  const [busy,setBusy]=useState(false),[verified,setVerified]=useState(false);
  const [error,setError]=useState(''),[copyStatus,setCopyStatus]=useState('');
  const [copyError,setCopyError]=useState('');
  const hostname=`_shadowbid.${domain}`;

  async function copy(value:string,label:string){
    setCopyStatus('');setCopyError('');
    try{await navigator.clipboard.writeText(value);setCopyStatus(`${label} copied.`);}
    catch{setCopyError('Could not copy. Select and copy the record shown above.');}
  }

  async function verify(){
    if(busy||verified||!challenge)return;
    setBusy(true);setError('');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(`/api/auctions/${id}/verify-dns`,{
        method:'POST',credentials:'same-origin',signal:controller.signal,
      });
      const result=await response.json().catch(()=>null);
      if(!response.ok||result?.ok!==true){
        throw Error(response.status===401?'Sign in again before checking DNS.':
          typeof result?.error==='string'?result.error:'DNS verification could not be confirmed. Try again.');
      }
      setVerified(true);
      router.refresh();
    }catch(cause){
      setError(controller.signal.aborted?'The DNS check timed out. Try again.':
        cause instanceof TypeError?'Could not reach the verification service. Check your connection and try again.':
        cause instanceof Error?cause.message:'DNS verification failed. Try again.');
    }finally{clearTimeout(timeout);setBusy(false);}
  }

  return <section className="notice dns-verification" aria-label="DNS control verification">
    <h2>Verify DNS control</h2>
    <p>Publish this TXT record before payment instructions can be issued. This checks DNS control, not legal ownership.</p>
    <div className="dns-record">
      <div><span>Hostname</span><code>{hostname}</code></div>
      <button type="button" className="btn secondary small" onClick={()=>copy(hostname,'Hostname')}>Copy hostname</button>
    </div>
    <div className="dns-record">
      <div><span>TXT value</span><code>{challenge||'Verification value unavailable'}</code></div>
      <button type="button" className="btn secondary small" disabled={!challenge} onClick={()=>{if(challenge)void copy(challenge,'TXT value');}}>Copy TXT value</button>
    </div>
    <p className="dns-hint">If your DNS provider appends the domain automatically, enter <code>_shadowbid</code> as the host. New records may take time to appear.</p>
    {copyStatus&&<p role="status">{copyStatus}</p>}
    {copyError&&<p role="alert">{copyError}</p>}
    <div className="dns-check-actions">
      <button type="button" className="btn secondary small" disabled={busy||verified||!challenge} onClick={verify}>
        {busy?'Checking DNS…':verified?'DNS verified':'Check DNS Again'}
      </button>
      <span role="status">{busy?'Looking up the TXT record…':verified?'DNS control verified.':'DNS control is not yet verified.'}</span>
    </div>
    {!challenge&&<p className="notice error" role="alert">This listing has no DNS verification value. Contact support before adding a TXT record.</p>}
    {error&&<p className="notice error" role="alert">{error}</p>}
  </section>;
}
