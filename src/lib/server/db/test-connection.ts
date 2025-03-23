import { db } from './index.js';
import { user } from './schema.js';

async function testConnection() {
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

    console.log('✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

testConnection(); 