export function safeE2eDatabaseUrl(){
  const raw=process.env.DATABASE_URL;
  if(!raw)throw Error('E2E tests require DATABASE_URL.');
  const url=new URL(raw);
  const app=new URL(process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000');
  if(process.env.E2E_ISOLATED_DB!=='true'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||!['localhost','127.0.0.1','[::1]'].includes(app.hostname)){
    throw Error('Refusing E2E database writes: set E2E_ISOLATED_DB=true with a loopback PostgreSQL URL and loopback app URL.');
  }
  return raw;
}
