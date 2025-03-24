import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { action } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  console.log('GET /api/actions - userId:', locals.userId);
  const allActions = await db.select()
    .from(action)
    .where(eq(action.userId, locals.userId));
  console.log('Found actions:', allActions);
  return json(allActions);
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json();
    console.log('POST /api/actions - userId:', locals.userId);
    const newActions = await db.insert(action)
      .values({
        userId: locals.userId,
        ...data
      })
      .returning();
    console.log('Created action:', newActions);
    return json(newActions);
  } catch (error) {
    console.error('Failed to create action:', error);
    return json({ 
      error: 'Failed to create action',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}; 