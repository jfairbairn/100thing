import { db } from '../db';
import { project, action } from '../server/db/schema';

export async function initDb() {
  // Create example project
  const [newProject] = await db.insert(project)
    .values({
      name: 'Example Project',
      description: 'A project to demonstrate the 100 Things app'
    })
    .returning();
    
  // Create example actions
  await db.insert(action)
    .values([
      {
        projectId: newProject.id,
        title: 'Write Blog Posts',
        description: 'Write 100 blog posts about various topics',
        targetCount: 100,
        currentCount: 0
      },
      {
        projectId: newProject.id,
        title: 'Read Books',
        description: 'Read 100 books and write summaries',
        targetCount: 100,
        currentCount: 0
      }
    ]);
} 