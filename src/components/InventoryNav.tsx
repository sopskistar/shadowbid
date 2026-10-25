import Link from 'next/link';

const items=[
  {href:'/auctions?view=owner',label:'Owner Auctions',key:'owner'},
  {href:'/auctions/dropping-soon',label:'Dropping Soon',key:'drop'},
  {href:'/auctions/pre-release',label:'Pre-Release',key:'pre'},
] as const;

export function InventoryNav({active}:{active:'owner'|'drop'|'pre'}){
  return <nav className="inventory-nav" aria-label="Inventory models">
    {items.map(item=><Link key={item.key} href={item.href} aria-current={item.key===active?'page':undefined} className={item.key===active?'is-active':''}>{item.label}</Link>)}
  </nav>;
}
