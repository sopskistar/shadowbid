export function validDomainName(domain:string){
  if(domain.length>253)return false;
  const labels=domain.split('.');
  if(labels.length<2)return false;
  if(!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(labels.at(-1)!))return false;
  return labels.every(label=>label.length>=1&&label.length<=63&&!label.startsWith('-')&&!label.endsWith('-')&&/^[a-z0-9-]+$/.test(label));
}
