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

  if (currentAction.completed) {
    return json({ error: 'Cannot add progress to completed action' }, { status: 400 });
  }
  
  // Calculate new count and ensure it doesn't exceed 100
  const newCount = Math.min(currentAction.currentCount + count, currentAction.targetCount);
  const actualProgress = newCount - currentAction.currentCount;
  
  if (actualProgress <= 0) {
    return json({ error: 'Action already at maximum progress' }, { status: 400 });
  }
  
  // Record the progress
  const [newProgress] = await db.insert(progress)
    .values({
      actionId,
      count: actualProgress
    })
    .returning();
    
  // Check for completion
  const isCompleted = newCount >= currentAction.targetCount;
    
  // Update the action's current count and completion status
  const [updatedAction] = await db.update(action)
    .set({
      currentCount: newCount,
      completed: isCompleted
    })
    .where(eq(action.id, actionId))
    .returning();
    
  return json({ progress: newProgress, action: updatedAction });
}; 