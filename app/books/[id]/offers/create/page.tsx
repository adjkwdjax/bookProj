'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { useAuthStore } from '@/src/store/authStore';

const schema = z.object({
  type: z.enum(['SALE', 'RENT', 'EXCHANGE']),
  price: z.preprocess((val) => Number(val), z.number().min(0).optional()),
  exchangePreferences: z.string().optional(),
  rentalPeriod: z.string().optional()
});

export default function CreateOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'SALE' as any }
  });
  const type = useWatch({ control, name: 'type' });
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Пожалуйста войтите, чтобы добавить предложение.</div>;
  }

  const onSubmit = async (data: any) => {
    setLoading(true);
    setApiError('');
    try {
      if (data.type === 'EXCHANGE') {
         data.price = undefined;
         data.rentalPeriod = undefined;
      } else if (data.type === 'SALE') {
         data.exchangePreferences = undefined;
         data.rentalPeriod = undefined;
      } else if (data.type === 'RENT') {
         data.exchangePreferences = undefined;
      }

      const res = await fetch(`/api/books/${id}/offers`, {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка при создании предложения');
      router.push(`/books/${id}`);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 w-full">
       <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
         <h1 className="text-2xl font-bold text-gray-900 mb-6">Создать предложение</h1>
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
           {apiError && <div className="text-red-500 text-sm">{apiError}</div>}
           <div>
              <label className="block text-sm font-medium text-gray-700">Тип предложения</label>
              <select {...register('type')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white">
                 <option value="SALE">Продажа</option>
                <option value="RENT">Аренда</option>
                <option value="EXCHANGE">Обмен</option>
              </select>
              {errors.type?.message && <p className="text-red-500 text-xs mt-1">{String(errors.type.message)}</p>}
           </div>

           {(type === 'SALE' || type === 'RENT') && (
             <div>
                <label className="block text-sm font-medium text-gray-700">Цена (₽)</label>
                <input type="number" step="0.01" {...register('price')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                {errors.price?.message && <p className="text-red-500 text-xs mt-1">{String(errors.price.message)}</p>}
             </div>
           )}

           {type === 'RENT' && (
             <div>
                <label className="block text-sm font-medium text-gray-700">Срок аренды</label>
                <input {...register('rentalPeriod')} placeholder="Например: 1 месяц" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                {errors.rentalPeriod?.message && <p className="text-red-500 text-xs mt-1">{String(errors.rentalPeriod.message)}</p>}
             </div>
           )}

           {type === 'EXCHANGE' && (
             <div>
                <label className="block text-sm font-medium text-gray-700">Предпочтения для обмена</label>
                 <textarea {...register('exchangePreferences')} placeholder="Какие книги вы ищете?" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                {errors.exchangePreferences?.message && <p className="text-red-500 text-xs mt-1">{String(errors.exchangePreferences.message)}</p>}
             </div>
           )}
           
           <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Размещение...' : 'Разместить предложение'}
            </button>
         </form>
       </div>
    </div>
  );
}
