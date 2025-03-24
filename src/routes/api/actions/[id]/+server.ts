import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { action, progress } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const updates = await request.json();
  
  const [updatedAction] = await db.update(action)
    .set(updates)
    .where(eq(action.id, parseInt(id)))
    .returning();
    
  return json(updatedAction);
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  // First delete all progress records for this action
  await db.delete(progress)
    .where(eq(progress.actionId, parseInt(id)));
    
  // Then delete the action
  await db.delete(action)
    .where(eq(action.id, parseInt(id)));
    
  return json({ success: true });
}; 