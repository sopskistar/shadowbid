import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import postgres from 'postgres';
import {drizzle} from 'drizzle-orm/postgres-js';
import * as schema from './schema';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is missing. Configure PostgreSQL and run npm run db:migrate.');
const client=postgres(process.env.DATABASE_URL,{max:5,prepare:false});
export const db=drizzle(client,{schema});
