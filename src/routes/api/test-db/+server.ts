import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
  try {
    // Test 1: Basic connection
    console.log('Testing database connection...');
    
    // Test 2: Create a test user
    const insertResult = await db.insert(user).values({
      age: 25
    }).returning();
    console.log('Successfully inserted user:', insertResult);

    // Test 3: Query the user back
    const users = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.id, insertResult[0].id)
    });
    console.log('Successfully queried user:', users);

    return json({
      success: true,
      message: 'Database connection successful',
      testResults: {
        insertedUser: insertResult[0],
        queriedUser: users
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}; 