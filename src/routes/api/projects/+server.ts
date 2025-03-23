import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { project, action } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  const allProjects = await db.query.project.findMany({
    with: {
      actions: true
    }
  });
  
  return json(allProjects);
};

export const POST: RequestHandler = async ({ request }) => {
  const { name, description } = await request.json();
  
  const [newProject] = await db.insert(project)
    .values({
      name,
      description
    })
    .returning();
    
  return json(newProject);
}; 