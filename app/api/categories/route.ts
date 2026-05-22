import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { mapCategory, query } from '@/src/lib/db.postgres';

export async function GET() {
  const res = await query('SELECT * FROM categories ORDER BY name ASC');
  return NextResponse.json(res.rows.map(mapCategory));
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId || (payload.role !== 'ADMIN' && payload.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const newCategory = { id: uuidv4(), name };
    await query('INSERT INTO categories (id, name) VALUES ($1, $2)', [newCategory.id, newCategory.name]);

    return NextResponse.json(newCategory);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
