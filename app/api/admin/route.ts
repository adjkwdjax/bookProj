import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapBook, mapCategory, mapOffer, mapPayment, mapTransaction, mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (payload?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [users, books, offers, transactions, payments, categories] = await Promise.all([
      query('SELECT * FROM users ORDER BY created_at DESC'),
      query('SELECT * FROM books ORDER BY created_at DESC'),
      query('SELECT * FROM offers ORDER BY created_at DESC'),
      query('SELECT * FROM transactions ORDER BY created_at DESC'),
      query('SELECT * FROM payments ORDER BY created_at DESC'),
      query('SELECT * FROM categories ORDER BY name ASC'),
    ]);

    return NextResponse.json({
      users: users.rows.map((row) => sanitizeUser(mapUser(row))),
      books: books.rows.map(mapBook),
      offers: offers.rows.map(mapOffer),
      transactions: transactions.rows.map(mapTransaction),
      payments: payments.rows.map(mapPayment),
      categories: categories.rows.map(mapCategory),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
