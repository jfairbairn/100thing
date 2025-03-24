import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { action } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
  const allActions = await db.query.action.findMany({
    with: {
      progress: true
    }
  });
  
  return json(allActions);
};

export const POST: RequestHandler = async ({ request }) => {
  const { title, description } = await request.json();
  
  const [newAction] = await db.insert(action)
    .values({
      title,
      description,
      targetCount: 100,
      currentCount: 0
    })
    .returning();
    
  return json(newAction);
}; 