import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		host: 'localhost',
		port: 5432,
		user: 'postgres',
		password: 'postgres',
		database: '100thing'
	},
} satisfies Config;
