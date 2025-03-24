import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { progress, action } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { actionId, count } = await request.json();
  
  // Get the current action and verify ownership
  const [currentAction] = await db.select()
    .from(action)
    .where(and(
      eq(action.id, actionId),
      eq(action.userId, locals.userId)
    ));
    
  if (!currentAction) {
    return json({ error: 'Action not found or unauthorized' }, { status: 404 });
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

export const DELETE: RequestHandler = async ({ request, locals }) => {
  const { actionId } = await request.json();
  
  // Get the current action and verify ownership
  const [currentAction] = await db.select()
    .from(action)
    .where(and(
      eq(action.id, actionId),
      eq(action.userId, locals.userId)
    ));
    
  if (!currentAction) {
    return json({ error: 'Action not found or unauthorized' }, { status: 404 });
  }

  if (currentAction.completed) {
    return json({ error: 'Cannot modify completed action' }, { status: 400 });
  }
  
  // Calculate new count and ensure it doesn't go below 0
  const newCount = Math.max(currentAction.currentCount - 1, 0);
  
  // Record the negative progress
  const [newProgress] = await db.insert(progress)
    .values({
      actionId,
      count: -1
    })
    .returning();
    
  // Update the action's current count
  const [updatedAction] = await db.update(action)
    .set({
      currentCount: newCount,
      completed: false
    })
    .where(eq(action.id, actionId))
    .returning();
    
  return json({ progress: newProgress, action: updatedAction });
};

export const GET: RequestHandler = async ({ request, locals }) => {
  const { actionId } = await request.json();
  
  // Verify ownership through the action
  const [existingAction] = await db.select()
    .from(action)
    .where(and(
      eq(action.id, actionId),
      eq(action.userId, locals.userId)
    ));
    
  if (!existingAction) {
    return json({ error: 'Action not found or unauthorized' }, { status: 404 });
  }

  // Get all progress records for this action
  const progressRecords = await db.select()
    .from(progress)
    .where(eq(progress.actionId, actionId))
    .orderBy(progress.createdAt);

  return json(progressRecords);
}; 