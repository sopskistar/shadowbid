import Link from 'next/link';
import {AuthForm} from '@/components/AuthForm';
export default async function Page({searchParams}:{searchParams:Promise<{verified?:string}>}){const {verified}=await searchParams;return <main className="container section"><span className="eyebrow">WELCOME BACK</span><h1>Sign in to ShadowBid</h1>{verified==='1'&&<div className="notice success" role="status">Email verified. Sign in to continue.</div>}<AuthForm mode="login"/><p>New here? <Link href="/signup">Create an account →</Link></p></main>}
