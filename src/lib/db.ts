import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import postgres from 'postgres';
import {drizzle} from 'drizzle-orm/postgres-js';
import * as schema from './schema';
const client=postgres(process.env.DATABASE_URL || 'postgres://invalid:invalid@localhost/invalid',{max:5,prepare:false});
export const db=drizzle(client,{schema});
