import { db } from '../db';
import { action } from '../server/db/schema';

export async function initDb() {
  // Create example actions
  await db.insert(action)
    .values([
      {
        title: 'Write Blog Posts',
        description: 'Write 100 blog posts about various topics',
        targetCount: 100,
        currentCount: 0
      },
      {
        title: 'Read Books',
        description: 'Read 100 books and write summaries',
        targetCount: 100,
        currentCount: 0
      }
    ]);
} 