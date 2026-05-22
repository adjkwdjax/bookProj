import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapNotification, query } from '@/src/lib/db.postgres';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(authHeader.split(' ')[1]);
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updated = await query(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [id, payload.userId]
  );
  if (!updated.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(mapNotification(updated.rows[0]));
}
