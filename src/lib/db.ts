import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './server/db/schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/100thing';

const client = postgres(connectionString);
export const db = drizzle(client, { schema }); 