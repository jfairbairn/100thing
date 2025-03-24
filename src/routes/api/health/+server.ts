import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
    try {
        // Test database connection by executing a simple query
        await db.execute(sql`SELECT 1`);
        
        return json({ status: 'ok' });
    } catch (error) {
        console.error('Health check failed:', error);
        return json({ 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}; 