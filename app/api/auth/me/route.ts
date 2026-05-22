import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [payload.userId]);
    if (!res.rows[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: sanitizeUser(mapUser(res.rows[0])) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
