export type EligibleReveal={id:string;amountZats:bigint;createdAt:Date};
export function selectHighestReveal<T extends EligibleReveal>(reveals:T[],minimum:bigint,reserve:bigint|null=null):T|undefined{
  return reveals.filter(b=>b.amountZats>=minimum&&(!reserve||b.amountZats>=reserve)).sort((a,b)=>a.amountZats===b.amountZats?a.createdAt.getTime()-b.createdAt.getTime()||a.id.localeCompare(b.id):a.amountZats>b.amountZats?-1:1)[0];
}
