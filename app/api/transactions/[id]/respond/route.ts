import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/jwt';
import { TransactionStatus, OfferStatus } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';
import { mapTransaction, query, withTransaction } from '@/src/lib/db.postgres';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const payload = await verifyToken(authHeader.split(' ')[1]);
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = payload.userId;

  try {
    const { action } = await req.json(); // 'ACCEPT' or 'REJECT'

    const txRes = await query('SELECT * FROM transactions WHERE id = $1 LIMIT 1', [id]);
    if (!txRes.rows[0]) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    const tx = mapTransaction(txRes.rows[0]);
    if (tx.sellerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (tx.status !== TransactionStatus.PENDING) return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });

    if (action !== 'ACCEPT' && action !== 'REJECT') {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const nextStatus = action === 'ACCEPT' ? TransactionStatus.COMPLETED : TransactionStatus.CANCELLED;

    await withTransaction(async (client) => {
      await client.query(
        'UPDATE transactions SET status = $2 WHERE id = $1',
        [id, nextStatus]
      );

      if (action === 'ACCEPT') {
        await client.query('UPDATE offers SET status = $2 WHERE id = $1', [tx.offerId, OfferStatus.COMPLETED]);
      }

      await client.query(
        `
          INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
          VALUES ($1, $2, $3, $4, FALSE, $5)
        `,
        [
          uuidv4(),
          tx.buyerId,
          action === 'ACCEPT' ? 'Обмен принят' : 'Обмен отклонен',
          action === 'ACCEPT'
            ? `Ваше предложение обмена (оффер ${tx.offerId}) принято владельцем!`
            : `Ваше предложение обмена (оффер ${tx.offerId}) отклонено владельцем.`,
          now,
        ]
      );
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...tx,
        status: nextStatus,
      },
    });
  } catch(err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
