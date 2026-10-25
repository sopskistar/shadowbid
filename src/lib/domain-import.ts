import {parseZec} from './crypto';
import {validDomainName} from './domain';

export type ImportedDomainInput={domain:string;description:string;startingZats:bigint;biddingEndsAt:Date;revealEndsAt:Date};
function cells(csv:string){
  const rows:string[][]=[];let row:string[]=[],value='',quoted=false;
  for(let i=0;i<csv.length;i++){
    const c=csv[i];
    if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++}else quoted=!quoted}
    else if(c===','&&!quoted){row.push(value);value=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value=''}
    else value+=c;
  }
  if(quoted)throw Error('CSV has an unclosed quoted field.');
  row.push(value);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
const headers=['domain','opening_price_zec','bidding_end'];
export function parseDomainCsv(csv:string,now=new Date(),short=false):ImportedDomainInput[]{
  if(typeof csv!=='string'||csv.length>64_000)throw Error('CSV must be smaller than 64 KB.');
  const rows=cells(csv.replace(/^\uFEFF/,''));
  if(rows.length<2||rows.length>21)throw Error('Upload 1–20 domains plus a header row.');
  const columns=rows[0].map(x=>x.trim().toLowerCase());
  if(columns.some((h,i)=>columns.indexOf(h)!==i))throw Error('CSV has duplicate column names.');
  if(headers.some(h=>!columns.includes(h))||columns.some(h=>![...headers,'reveal_end','description'].includes(h)))throw Error('Use headers: domain, opening_price_zec, bidding_end, reveal_end, description.');
  const value=(row:string[],key:string)=>row[columns.indexOf(key)]?.trim()||'';
  const domains=new Set<string>();
  return rows.slice(1).map((row,index)=>{
    if(row.length!==columns.length)throw Error(`Row ${index+2} has the wrong number of columns.`);
    const domain=value(row,'domain').toLowerCase().replace(/\.$/,'');
    if(!validDomainName(domain)||/\.(example|invalid|test|localhost)$/.test(domain))throw Error(`Row ${index+2} has an invalid or reserved domain.`);
    if(domains.has(domain))throw Error(`Duplicate domain in CSV: ${domain}.`);domains.add(domain);
    const description=value(row,'description');if(description.length>2000)throw Error(`Description for ${domain} is too long.`);
    let startingZats:bigint;try{startingZats=parseZec(value(row,'opening_price_zec'))}catch{throw Error(`Invalid opening price for ${domain}.`)}
    const rawEnd=value(row,'bidding_end'),rawReveal=value(row,'reveal_end');
    if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)$/.test(rawEnd))throw Error(`Use an ISO 8601 bidding_end with timezone for ${domain}.`);
    const biddingEndsAt=new Date(rawEnd);
    if(!Number.isFinite(biddingEndsAt.getTime())||biddingEndsAt.getTime()-now.getTime()<(short?2:60)*60_000||biddingEndsAt.getTime()-now.getTime()>30*86400000)throw Error(`Bidding deadline for ${domain} must be between ${short?2:60} minutes and 30 days from now.`);
    if(rawReveal&&!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)$/.test(rawReveal))throw Error(`Use an ISO 8601 reveal_end with timezone for ${domain}.`);
    const revealEndsAt=rawReveal?new Date(rawReveal):new Date(biddingEndsAt.getTime()+(short?2:30)*60_000);
    if(!Number.isFinite(revealEndsAt.getTime())||revealEndsAt.getTime()-biddingEndsAt.getTime()<(short?2:30)*60_000||revealEndsAt.getTime()-biddingEndsAt.getTime()>7*86400000)throw Error(`Reveal deadline for ${domain} must be ${short?2:30} minutes to seven days after bidding closes.`);
    return {domain,description,startingZats,biddingEndsAt,revealEndsAt};
  });
}
