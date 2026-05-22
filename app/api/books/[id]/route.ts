import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapBook, mapCategory, mapOffer, mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookRes = await query('SELECT * FROM books WHERE id = $1 LIMIT 1', [id]);
  if (!bookRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const book = mapBook(bookRes.rows[0]);
  const categoryRes = await query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [book.categoryId]);
  const ownerRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [book.ownerId]);
  const offersRes = await query('SELECT * FROM offers WHERE book_id = $1 ORDER BY created_at DESC', [book.id]);

  const populated: any = {
    ...book,
    category: categoryRes.rows[0] ? mapCategory(categoryRes.rows[0]) : undefined,
    owner: ownerRes.rows[0] ? sanitizeUser(mapUser(ownerRes.rows[0])) : undefined,
    offers: offersRes.rows.map(mapOffer),
  };

  return NextResponse.json(populated);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization');
  const payload = authHeader ? await verifyToken(authHeader.split(' ')[1]) : null;
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookRes = await query('SELECT * FROM books WHERE id = $1 LIMIT 1', [id]);
  if (!bookRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const targetBook = mapBook(bookRes.rows[0]);
  const reqUserRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [payload.userId]);
  const reqUser = reqUserRes.rows[0] ? mapUser(reqUserRes.rows[0]) : null;
  const isOwner = targetBook.ownerId === payload.userId;
  const isAdmin = reqUser?.role === 'ADMIN';
  const modCategory = reqUser?.role === 'MODERATOR'
    ? await query('SELECT 1 FROM categories WHERE id = $1 AND moderator_id = $2 LIMIT 1', [targetBook.categoryId, payload.userId])
    : null;
  const isMod = !!modCategory?.rowCount;

  if (!isOwner && !isAdmin && !isMod) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await req.json();
  const updated = {
    ...targetBook,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await query(
    `
      UPDATE books
      SET title = $2, author = $3, description = $4, image_url = $5, category_id = $6, published_year = $7, updated_at = $8
      WHERE id = $1
    `,
    [
      id,
      updated.title,
      updated.author,
      updated.description,
      updated.imageUrl || null,
      updated.categoryId,
      (updated as any).publishedYear || null,
      updated.updatedAt,
    ]
  );

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization');
  const payload = authHeader ? await verifyToken(authHeader.split(' ')[1]) : null;
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookRes = await query('SELECT * FROM books WHERE id = $1 LIMIT 1', [id]);
  if (!bookRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const targetBook = mapBook(bookRes.rows[0]);
  const reqUserRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [payload.userId]);
  const reqUser = reqUserRes.rows[0] ? mapUser(reqUserRes.rows[0]) : null;
  const isOwner = targetBook.ownerId === payload.userId;
  const isAdmin = reqUser?.role === 'ADMIN';
  const modCategory = reqUser?.role === 'MODERATOR'
    ? await query('SELECT 1 FROM categories WHERE id = $1 AND moderator_id = $2 LIMIT 1', [targetBook.categoryId, payload.userId])
    : null;
  const isMod = !!modCategory?.rowCount;

  if (!isOwner && !isAdmin && !isMod) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await query('DELETE FROM books WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
