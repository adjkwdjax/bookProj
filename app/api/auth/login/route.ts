import { NextResponse } from 'next/server';
import { signToken } from '@/src/lib/jwt';
import { mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = res.rows[0] ? mapUser(res.rows[0]) : null;
    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 400 });
    }

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
