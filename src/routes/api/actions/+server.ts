import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { action } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
  const allActions = await db.query.action.findMany();
  return json(allActions);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const newAction = await db.insert(action).values(data).returning();
  return json(newAction[0]);
}; 