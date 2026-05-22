import { NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { TransactionStatus, PaymentStatus, OfferStatus } from '@/src/types';
import { query, withTransaction } from '@/src/lib/db.postgres';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(authHeader.split(' ')[1]);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const buyerId = payload.userId as string;

    const { offerId, cardNumber, exchangeMessage, buyerPhone } = await req.json();
    const normalizedPhone = String(buyerPhone ?? '').trim();

    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const offerRes = await query('SELECT * FROM offers WHERE id = $1 LIMIT 1', [offerId]);
    const offer = offerRes.rows[0];
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.status !== OfferStatus.OPEN) return NextResponse.json({ error: 'Offer is no longer open' }, { status: 400 });
    if (offer.creator_id === buyerId) return NextResponse.json({ error: 'Cannot buy your own offer' }, { status: 400 });

    const isExchange = offer.type === 'EXCHANGE';
    const transactionId = uuidv4();
    const now = new Date().toISOString();

    if (!isExchange && cardNumber?.endsWith('0000')) {
      return NextResponse.json({ error: 'Payment declined by bank', status: 'FAILED' }, { status: 400 });
    }

    await withTransaction(async (client) => {
      const finalStatus = isExchange ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

      await client.query(
        `
          INSERT INTO transactions (id, offer_id, buyer_id, seller_id, buyer_phone, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [transactionId, offer.id, buyerId, offer.creator_id, normalizedPhone, finalStatus, now]
      );

      if (!isExchange) {
        await client.query(
          `
            INSERT INTO payments (id, transaction_id, amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [uuidv4(), transactionId, offer.price || 0, PaymentStatus.SUCCESS, now]
        );
      }

      if (!isExchange) {
        await client.query('UPDATE offers SET status = $2 WHERE id = $1', [offer.id, OfferStatus.COMPLETED]);
      }

      if (isExchange) {
        await client.query(
          `
            INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
            VALUES
              ($1, $2, $3, $4, FALSE, $5),
              ($6, $7, $8, $9, FALSE, $10)
          `,
          [
            uuidv4(),
            buyerId,
            'Предложение отправлено',
            `Вы предложили обмен (оффер ${offer.id}). Ожидайте ответа от владельца.`,
            now,
            uuidv4(),
            offer.creator_id,
            'Новое предложение обмена',
            `Пользователь предложил обмен для оффера ${offer.id}. Сообщение: "${exchangeMessage}"`,
            now,
          ]
        );
      } else {
        await client.query(
          `
            INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
            VALUES
              ($1, $2, $3, $4, FALSE, $5),
              ($6, $7, $8, $9, FALSE, $10)
          `,
          [
            uuidv4(),
            buyerId,
            'Сделка успешна',
            `Вы успешно оплатили предложение ${offer.id}`,
            now,
            uuidv4(),
            offer.creator_id,
            'Предложение принято',
            `Ваше предложение ${offer.id} успешно завершено.`,
            now,
          ]
        );
      }
    });

    return NextResponse.json({ success: true, transactionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
