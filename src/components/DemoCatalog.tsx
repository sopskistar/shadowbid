'use client';
import Link from 'next/link';
import {motion} from 'motion/react';
import {formatZec} from '@/lib/crypto';
import type {DemoDomain} from '@/lib/demo-catalog';

// Homepage previews only. The full Demo Market shares the real marketplace browser.
export function DemoDomainCard({item}:{item:DemoDomain}){
  return <motion.article className="panel card demo-domain-card" whileHover={{y:-4}}>
    <span className="eyebrow">MARKET PREVIEW</span>
    <h3>{item.domain}</h3>
    <div className="row"><span>Illustrative opening bid</span><strong>{formatZec(item.illustrativeZats)} ZEC</strong></div>
    <Link className="btn secondary" href="/auctions">Explore marketplace →</Link>
  </motion.article>;
}
