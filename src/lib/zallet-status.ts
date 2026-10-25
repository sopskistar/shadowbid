function height(value:unknown){if(typeof value==='number')return value;if(value&&typeof value==='object'&&'height'in value)return Number((value as {height:unknown}).height);return NaN;}
export function walletSynced(status:unknown){
  if(!status||typeof status!=='object')return false;
  const data=status as Record<string,unknown>;
  const node=height(data.node_tip),wallet=height(data.wallet_tip),full=height(data.fully_synced_height);
  if(!Number.isSafeInteger(node)||!Number.isSafeInteger(wallet)||node<0||wallet<node-2||wallet>node)return false;
  const nodeHash=(data.node_tip as {blockhash?:unknown})?.blockhash;
  const walletHash=(data.wallet_tip as {blockhash?:unknown})?.blockhash;
  if(node===wallet&&typeof nodeHash==='string'&&typeof walletHash==='string'&&nodeHash!==walletHash)return false;
  if(data.fully_synced_height!==undefined)return Number.isSafeInteger(full)&&full>=node-2&&full<=node;
  return node===wallet&&typeof nodeHash==='string'&&nodeHash===walletHash;
}
