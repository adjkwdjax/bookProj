import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapNotification, query } from '@/src/lib/db.postgres';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(authHeader.split(' ')[1]);
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [payload.userId]
  );
  return NextResponse.json(res.rows.map(mapNotification));
}
