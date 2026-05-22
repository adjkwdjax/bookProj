import { NextResponse } from 'next/server';
import { mapBook, mapOffer, mapUser, query, sanitizeUser } from '@/src/lib/db.postgres';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offerRes = await query('SELECT * FROM offers WHERE id = $1 LIMIT 1', [id]);
  if (!offerRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const offer = mapOffer(offerRes.rows[0]);
  const bookRes = await query('SELECT * FROM books WHERE id = $1 LIMIT 1', [offer.bookId]);
  const ownerRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [offer.creatorId]);

  return NextResponse.json({
    ...offer,
    book: bookRes.rows[0] ? mapBook(bookRes.rows[0]) : undefined,
    owner: ownerRes.rows[0] ? sanitizeUser(mapUser(ownerRes.rows[0])) : undefined,
  });
}
