import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { action, progress } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  const [actionData] = await db.select()
    .from(action)
    .where(and(
      eq(action.id, parseInt(params.id)),
      eq(action.userId, locals.userId)
    ));

  if (!actionData) {
    return json({ error: 'Action not found or unauthorized' }, { status: 404 });
  }

  return json(actionData);
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  const data = await request.json();
  const { updatedAt, createdAt, ...restData } = data;
  
  // Verify ownership before updating
  const [existingAction] = await db.select()
    .from(action)
    .where(and(
      eq(action.id, parseInt(params.id)),
      eq(action.userId, locals.userId)
    ));

  if (!existingAction) {
    return json({ error: 'Action not found or unauthorized' }, { status: 404 });
  }
  
  const [updatedAction] = await db
    .update(action)
    .set(restData)
    .where(and(
      eq(action.id, parseInt(params.id)),
      eq(action.userId, locals.userId)
    ))
    .returning();

  return json(updatedAction);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const actionId = parseInt(params.id);
  
  // Verify ownership before deleting
  const [existingAction] = await db.select()
    .from(action)
    .where(and(
      eq(action.id, actionId),
      eq(action.userId, locals.userId)
    ));

  if (!existingAction) {
    return json({ error: 'Action not found or unauthorized' }, { status: 404 });
  }
  
  // First delete all related progress records
  await db
    .delete(progress)
    .where(eq(progress.actionId, actionId));
    
  // Then delete the action
  await db
    .delete(action)
    .where(and(
      eq(action.id, actionId),
      eq(action.userId, locals.userId)
    ));
    
  return new Response(null, { status: 204 });
}; 