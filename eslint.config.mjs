import {defineConfig,globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Request-time clocks are intentional in server-rendered pages.
  {files:['src/app/page.tsx','src/app/checkout/**/page.tsx'],rules:{'react-hooks/purity':'off'}},
  // QR codes are generated as inline data URLs; image optimization cannot help.
  {files:['src/app/checkout/**/page.tsx'],rules:{'@next/next/no-img-element':'off'}},
  // Zallet beta JSON-RPC response fields differ between shipped versions.
  {files:['worker/zallet.ts'],rules:{'@typescript-eslint/no-explicit-any':'off'}},
  globalIgnores(['.next/**','node_modules/**','drizzle/**','screenshots/**','test-results/**','playwright-report/**'])
]);
