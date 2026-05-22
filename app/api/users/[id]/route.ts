import { NextRequest, NextResponse } from 'next/server';
import { mapBook, mapCategory, mapUser, query } from '@/src/lib/db.postgres';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  if (!userRes.rows[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = mapUser(userRes.rows[0]);
  const booksRes = await query(
    `
        SELECT b.*, c.id AS c_id, c.name AS c_name, c.moderator_id AS c_moderator_id
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.owner_id = $1
      ORDER BY b.created_at DESC
    `,
    [id]
  );

  const userBooks = booksRes.rows.map((row: any) => ({
    ...mapBook(row),
    category: row.c_id
        ? mapCategory({ id: row.c_id, name: row.c_name, moderator_id: row.c_moderator_id })
      : undefined,
  }));

  // Strip sensitive info
  const publicUser = {
    id: user.id,
    name: user.name,
    role: user.role,
     isBlocked: user.isBlocked,
  };

  return NextResponse.json({ user: publicUser, books: userBooks });
}
