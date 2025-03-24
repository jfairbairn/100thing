import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { action } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, params }) => {
  const data = await request.json();
  const { updatedAt, createdAt, ...restData } = data;
  
  const updatedAction = await db
    .update(action)
    .set(restData)
    .where(eq(action.id, parseInt(params.id)))
    .returning();

  return json(updatedAction[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
  await db
    .delete(action)
    .where(eq(action.id, parseInt(params.id)));
  return new Response(null, { status: 204 });
}; 