import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { Role } from '@/src/types';
import { mapUser, query } from '@/src/lib/db.postgres';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') throw new Error('Forbidden');

    const userRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    if (!userRes.rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = mapUser(userRes.rows[0]);

    const { role, moderatedCategoryIds } = await req.json();

    const nextRole = role || user.role;
    await query('UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1', [id, nextRole as Role]);

    if (nextRole === 'MODERATOR' && Array.isArray(moderatedCategoryIds)) {
      await query('UPDATE categories SET moderator_id = NULL WHERE moderator_id = $1', [id]);
      for (const categoryId of moderatedCategoryIds) {
        await query('UPDATE categories SET moderator_id = $2 WHERE id = $1', [categoryId, id]);
      }
    }

    if (nextRole !== 'MODERATOR') {
      await query('UPDATE categories SET moderator_id = NULL WHERE moderator_id = $1', [id]);
    }

    const updatedRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    const updatedUser = mapUser(updatedRes.rows[0]);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
