import { verifyToken } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Skip auth check for public routes and auth endpoints
    if (!event.url.pathname.startsWith('/api/') || event.url.pathname.startsWith('/api/auth/')) {
        return resolve(event);
    }

    // Check for auth token in headers
    const authHeader = event.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Add user ID to event.locals for use in routes
    event.locals.userId = payload.userId;

    return resolve(event);
}; 