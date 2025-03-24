import { db } from './db';
import { user } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET || 'your-secret-key'; // In production, always use env variable

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
        return null;
    }
}

export async function getUserByEmail(email: string) {
    return db.query.user.findFirst({
        where: eq(user.email, email)
    });
}

export async function getUserById(id: number) {
    return db.query.user.findFirst({
        where: eq(user.id, id)
    });
}

export async function createUser(email: string, password: string, name: string) {
    const passwordHash = await hashPassword(password);
    const [newUser] = await db.insert(user)
        .values({
            email,
            passwordHash,
            name
        })
        .returning();
    return newUser;
}

export async function authenticateUser(email: string, password: string) {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    return user;
} 