import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { mapBook, mapCategory, mapOffer, mapPayment, mapTransaction, query } from '@/src/lib/db.postgres';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = payload.userId as string;

    const booksRes = await query(
      `
        SELECT b.*, c.id AS c_id, c.name AS c_name, c.moderator_id AS c_moderator_id
        FROM books b
        LEFT JOIN categories c ON c.id = b.category_id
        WHERE b.owner_id = $1
        ORDER BY b.created_at DESC
      `,
      [userId]
    );

    const myBooks = booksRes.rows.map((row: any) => ({
      ...mapBook(row),
      category: row.c_id ? mapCategory({ id: row.c_id, name: row.c_name, moderator_id: row.c_moderator_id }) : undefined,
    }));

    const offersRes = await query(
      `
        SELECT o.*, b.id AS b_id, b.title AS b_title, b.author AS b_author, b.description AS b_description,
               b.image_url AS b_image_url, b.category_id AS b_category_id, b.owner_id AS b_owner_id,
               b.created_at AS b_created_at, b.updated_at AS b_updated_at
        FROM offers o
        LEFT JOIN books b ON b.id = o.book_id
        WHERE o.creator_id = $1
        ORDER BY o.created_at DESC
      `,
      [userId]
    );

    const myOffers = offersRes.rows.map((row: any) => ({
      ...mapOffer(row),
      book: row.b_id
        ? mapBook({
            id: row.b_id,
            title: row.b_title,
            author: row.b_author,
            description: row.b_description,
            image_url: row.b_image_url,
            category_id: row.b_category_id,
            owner_id: row.b_owner_id,
            created_at: row.b_created_at,
            updated_at: row.b_updated_at,
          })
        : undefined,
    }));

    const transactionsRes = await query(
      `
        SELECT t.*, o.id AS o_id, o.book_id AS o_book_id, o.creator_id AS o_creator_id, o.type AS o_type,
           o.price AS o_price, o.description AS o_description,
           o.rent_days AS o_rent_days, o.status AS o_status, o.created_at AS o_created_at,
               u.id AS other_id, u.name AS other_name, u.email AS other_email, u.password_hash AS other_password_hash,
           u.role AS other_role, u.avatar_url AS other_avatar_url, u.created_at AS other_created_at,
            u.is_banned AS other_is_banned
        FROM transactions t
        LEFT JOIN offers o ON o.id = t.offer_id
        LEFT JOIN users u ON u.id = CASE WHEN t.buyer_id = $1 THEN t.seller_id ELSE t.buyer_id END
        WHERE t.buyer_id = $1 OR t.seller_id = $1
        ORDER BY t.created_at DESC
      `,
      [userId]
    );

    const myTransactions = transactionsRes.rows.map((row: any) => ({
      ...mapTransaction(row),
      buyerPhone: row.buyer_phone || undefined,
      offer: row.o_id
        ? mapOffer({
            id: row.o_id,
            book_id: row.o_book_id,
            creator_id: row.o_creator_id,
            type: row.o_type,
            price: row.o_price,
            description: row.o_description,
            rent_days: row.o_rent_days,
            status: row.o_status,
            created_at: row.o_created_at,
          })
        : undefined,
      otherParty: row.other_name || undefined,
      isSeller: row.seller_id === userId,
    }));

    const paymentsRes = await query(
      `
        SELECT p.*
        FROM payments p
        JOIN transactions t ON t.id = p.transaction_id
        WHERE t.buyer_id = $1 OR t.seller_id = $1
        ORDER BY p.created_at DESC
      `,
      [userId]
    );
    const myPayments = paymentsRes.rows.map(mapPayment);

    return NextResponse.json({
      books: myBooks,
      offers: myOffers,
      transactions: myTransactions,
      payments: myPayments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
