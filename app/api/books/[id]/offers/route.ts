import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { OfferStatus } from '@/src/types';
import { mapBook, query } from '@/src/lib/db.postgres';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookRes = await query('SELECT * FROM books WHERE id = $1 LIMIT 1', [id]);
    if (!bookRes.rows[0]) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    const book = mapBook(bookRes.rows[0]);
    
    if (book.ownerId !== payload.userId) return NextResponse.json({ error: 'Forbidden. Not book owner.' }, { status: 403 });

    const data = await req.json();
    const newOffer = {
      ...data,
      id: uuidv4(),
      bookId: book.id,
      creatorId: payload.userId as string,
      status: OfferStatus.OPEN,
      createdAt: new Date().toISOString()
    };

    const offerType = newOffer.type === 'SELL' || newOffer.type === 'SALE' ? 'SALE' : newOffer.type;

    await query(
      `
        INSERT INTO offers (id, book_id, creator_id, type, price, description, rent_days, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        newOffer.id,
        newOffer.bookId,
        newOffer.creatorId,
        offerType,
        newOffer.price ?? null,
        newOffer.description ?? null,
        newOffer.rentDays ?? null,
        newOffer.status,
        newOffer.createdAt,
      ]
    );

    return NextResponse.json(newOffer);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
