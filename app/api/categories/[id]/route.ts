import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapCategory, query } from '@/src/lib/db.postgres';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId || (payload.role !== 'ADMIN' && payload.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, moderatorId } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const existing = await query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
    if (!existing.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await query('UPDATE categories SET name = $2, moderator_id = COALESCE($3, moderator_id) WHERE id = $1', [id, name, moderatorId || null]);
    const updated = await query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
    return NextResponse.json(mapCategory(updated.rows[0]));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId || (payload.role !== 'ADMIN' && payload.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (!deleted.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
