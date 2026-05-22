import { NextResponse } from 'next/server';
import { signToken } from '@/src/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@/src/types';
import { mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const exists = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const userId = uuidv4();
    const createdAt = new Date().toISOString();
    await query(
      `
        INSERT INTO users (id, email, password_hash, name, role, is_banned, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, FALSE, $6, $6)
      `,
      [userId, name, email, password, Role.USER, createdAt]
    );

    const newUser = {
      id: userId,
      name,
      email,
      passwordHash: password,
      role: Role.USER,
      createdAt,
    };

    const token = await signToken({ userId: newUser.id, role: newUser.role });

    const mapped = mapUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password_hash: newUser.passwordHash,
      role: newUser.role,
      created_at: newUser.createdAt,
      is_banned: false,
      avatar_url: null,
    });

    return NextResponse.json({
      token,
      user: sanitizeUser(mapped),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
