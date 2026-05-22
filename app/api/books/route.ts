import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { mapBook, mapCategory, mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.toLowerCase() || '';
  const categoryId = searchParams.get('categoryId');

  const conditions: string[] = ['EXISTS (SELECT 1 FROM offers o WHERE o.book_id = b.id AND o.status = \'OPEN\')', 'COALESCE(u.is_banned, FALSE) = FALSE'];
  const params: any[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(b.title) LIKE $${params.length} OR LOWER(b.author) LIKE $${params.length})`);
  }

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`b.category_id = $${params.length}`);
  }

  const rows = await query(
    `
      SELECT
        b.*, 
        c.id AS c_id, c.name AS c_name, c.moderator_id AS c_moderator_id,
        u.id AS u_id, u.name AS u_name, u.email AS u_email, u.password_hash AS u_password_hash,
        u.role AS u_role, u.avatar_url AS u_avatar_url, u.created_at AS u_created_at,
        u.is_banned AS u_is_banned
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN users u ON u.id = b.owner_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.created_at DESC
    `,
    params
  );

  const populated = rows.rows.map((row: any) => ({
    ...mapBook(row),
    category: row.c_id ? mapCategory({ id: row.c_id, name: row.c_name, moderator_id: row.c_moderator_id }) : undefined,
    owner: row.u_id
      ? sanitizeUser(
          mapUser({
            id: row.u_id,
            name: row.u_name,
            email: row.u_email,
            password_hash: row.u_password_hash,
            role: row.u_role,
            avatar_url: row.u_avatar_url,
            created_at: row.u_created_at,
            is_banned: row.u_is_banned,
          })
        )
      : undefined,
  }));

  return NextResponse.json(populated);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const now = new Date().toISOString();
    const newBook = {
      ...data,
      id: uuidv4(),
      ownerId: payload.userId as string,
      createdAt: now,
      updatedAt: now,
    };

    await query(
      `
        INSERT INTO books (id, owner_id, category_id, title, author, description, image_url, published_year, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        newBook.id,
        newBook.ownerId,
        newBook.categoryId || null,
        newBook.title,
        newBook.author || null,
        newBook.description || null,
        newBook.imageUrl || null,
        newBook.publishedYear || null,
        newBook.createdAt,
        newBook.updatedAt,
      ]
    );

    return NextResponse.json(newBook);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
