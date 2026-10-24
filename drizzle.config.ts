import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { defineConfig } from 'drizzle-kit';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is missing. Set it in .env.local or the process environment.');
export default defineConfig({schema:'./src/lib/schema.ts',out:'./drizzle',dialect:'postgresql',dbCredentials:{url:process.env.DATABASE_URL!}});
