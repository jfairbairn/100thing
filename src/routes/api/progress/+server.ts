import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { progress, action } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  const { actionId, count } = await request.json();
  
  // Get the current action
  const [currentAction] = await db.select()
    .from(action)
    .where(eq(action.id, actionId));
    
  if (!currentAction) {
    return json({ error: 'Action not found' }, { status: 404 });
  }
  
  // Record the progress
  const [newProgress] = await db.insert(progress)
    .values({
      actionId,
      count
    })
    .returning();
    
  // Update the action's current count
  const [updatedAction] = await db.update(action)
    .set({
      currentCount: currentAction.currentCount + count
    })
    .where(eq(action.id, actionId))
    .returning();
    
  return json({ progress: newProgress, action: updatedAction });
}; 