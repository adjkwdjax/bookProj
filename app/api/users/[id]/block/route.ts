import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapUser, query } from '@/src/lib/db.postgres';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'MODERATOR')) throw new Error('Forbidden');

    const userRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    if (!userRes.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = mapUser(userRes.rows[0]);
    if (targetUser.role === 'ADMIN') return NextResponse.json({ error: 'Cannot block admin' }, { status: 403 });

    await query('UPDATE users SET is_banned = TRUE WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
