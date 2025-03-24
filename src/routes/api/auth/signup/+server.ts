import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createUser, generateToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { action } from '$lib/server/db/schema';
import { isNull } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.email, email)
        });

        if (existingUser) {
            return json({ error: 'User already exists' }, { status: 400 });
        }

        // Create new user
        const newUser = await createUser(email, password, name);

        // If this is the first user, assign all existing actions to them
        const existingActions = await db.query.action.findMany({
            where: isNull(action.userId)
        });

        if (existingActions.length > 0) {
            await db.update(action)
                .set({ userId: newUser.id })
                .where(isNull(action.userId));
        }

        // Generate token
        const token = generateToken(newUser.id);

        return json({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        return json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 