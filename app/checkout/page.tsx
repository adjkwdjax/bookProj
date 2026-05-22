'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';

const schema = z.object({
  buyerPhone: z.string().min(5, 'Введите номер телефона').max(32, 'Слишком длинный номер'),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvv: z.string().optional(),
  name: z.string().optional(),
  exchangeMessage: z.string().optional(),
});

function CheckoutContent() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId');
  const [offer, setOffer] = useState<any>(null);
  const [offerLoaded, setOfferLoaded] = useState(false);
  const loadingOffer = !!offerId && !offerLoaded;
  
  const { user, token } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successStatus, setSuccessStatus] = useState(false);

  useEffect(() => {
    if (!offerId) {
      return;
    }
    fetch(`/api/offers/${offerId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setOffer(data);
      })
      .finally(() => {
        setOfferLoaded(true);
      });
  }, [offerId]);

  if (!user) return <div className="p-8 text-center text-gray-500">Пожалуйста войтите в аккаунт.</div>;
  if (loadingOffer) return <div className="p-8 text-center text-gray-500">Загрузка информации...</div>;
  if (!offer) return <div className="p-8 text-center text-red-500">Предложение не найдено!</div>;

  const onSubmit = async (data: any) => {
    setLoading(true); setApiError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          offerId,
          cardNumber: data.cardNumber,
          exchangeMessage: data.exchangeMessage,
          buyerPhone: data.buyerPhone,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка при обработке запроса');
      setSuccessStatus(true);
      setTimeout(() => {
         router.push('/profile');
      }, 2000);
    } catch(e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (successStatus) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{offer?.type === 'EXCHANGE' ? 'Сделка заключена!' : 'Оплата прошла успешно!'}</h2>
        <p className="text-gray-500">Ваш запрос был безопасно обработан. Перенаправление...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
       <div>
         <h2 className="text-2xl font-bold text-gray-900 mb-6">Обзор заказа</h2>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
           {offer.book && (
             <div className="flex items-center gap-4">
               <img src={offer.book.imageUrl || `https://picsum.photos/seed/${offer.book.id}/100/150`} className="w-16 h-24 object-cover rounded" />
               <div>
                  <h3 className="font-semibold">{offer.book.title}</h3>
                  <p className="text-sm text-gray-500">{offer.book.author}</p>
               </div>
             </div>
           )}
           <hr />
           <div className="flex justify-between font-medium">
             <span>Тип</span>
             <span className="text-indigo-600">{offer.type === 'SALE' ? 'Продажа' : (offer.type === 'RENT' ? 'Аренда' : 'Обмен')}</span>
           </div>
           {offer.type === 'RENT' && offer.rentalPeriod && (
             <div className="flex justify-between font-medium">
               <span>Срок аренды</span>
               <span className="text-gray-600">{offer.rentalPeriod}</span>
             </div>
           )}
           {offer.price !== undefined && offer.type !== 'EXCHANGE' && (
             <div className="flex justify-between items-center mt-4">
               <span className="text-lg">Итого</span>
               <span className="text-2xl font-bold">{offer.price.toFixed(2)} ₽</span>
             </div>
           )}
         </div>
       </div>

       <div>
         <h2 className="text-2xl font-bold text-gray-900 mb-6">{offer.type === 'EXCHANGE' ? 'Детали обмена' : 'Оплата'}</h2>
         <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
           {apiError && <div className="p-3 bg-red-50 text-red-600 rounded text-sm text-center">{apiError}</div>}
           
           {offer.type !== 'EXCHANGE' ? (
             <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Номер телефона</label>
                <input {...register('buyerPhone')} required placeholder="+7 (999) 123-45-67" className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                {errors.buyerPhone?.message && <p className="text-red-500 text-xs mt-1">{String(errors.buyerPhone.message)}</p>}
              </div>
               <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded mb-4">Тестовая оплата: Введите любой номер из 16 цифр. Окончание на 0000 симулирует отказ.</div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Имя на карте</label>
                  <input {...register('name')} required className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  {errors.name?.message && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Номер карты</label>
                  <input {...register('cardNumber')} required placeholder="0000 0000 0000 0000" className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  {errors.cardNumber?.message && <p className="text-red-500 text-xs mt-1">{String(errors.cardNumber.message)}</p>}
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Срок (ММ/ГГ)</label>
                    <input {...register('expiry')} required placeholder="12/25" className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    {errors.expiry?.message && <p className="text-red-500 text-xs mt-1">{String(errors.expiry.message)}</p>}
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">CVV</label>
                    <input {...register('cvv')} required placeholder="123" type="password" maxLength={4} className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    {errors.cvv?.message && <p className="text-red-500 text-xs mt-1">{String(errors.cvv.message)}</p>}
                 </div>
               </div>
             </>
           ) : (
             <div>
                <label className="block text-sm font-medium text-gray-700">Номер телефона</label>
                <input {...register('buyerPhone')} required placeholder="+7 (999) 123-45-67" className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-4" />
                <label className="block text-sm font-medium text-gray-700">Сообщение для обмена</label>
                <textarea {...register('exchangeMessage')} required placeholder="Напишите, какую книгу вы предлагаете взамен..." rows={4} className="mt-1 block w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
             </div>
           )}

           <button
              type="submit" disabled={loading}
              className="mt-6 w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {offer.type !== 'EXCHANGE' && <Lock className="w-4 h-4 mr-2" />}
              {loading ? 'Обработка...' : (offer.type === 'EXCHANGE' ? 'Оформить обмен' : `Оплатить ${offer.price ? offer.price.toFixed(2) + ' ₽' : ''}`)}
            </button>
         </form>
       </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Загрузка...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
