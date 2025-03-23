import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/100thing';

const runMigration = async () => {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migration...');

  await migrate(db, {
    migrationsFolder: './drizzle'
  });

  console.log('Migration completed');
  process.exit(0);
};

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 