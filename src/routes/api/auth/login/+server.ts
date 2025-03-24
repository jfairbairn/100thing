import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateUser, generateToken } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const user = await authenticateUser(email, password);
        if (!user) {
            return json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = generateToken(user.id);

        return json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 