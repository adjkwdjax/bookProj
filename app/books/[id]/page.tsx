'use client';

import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then(res => res.json())
      .then(data => {
        setBook(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  }

  if (!book?.id) {
    return <div className="p-8 text-center text-red-500">Книга не найдена</div>;
  }

  const isOwner = user?.id === book.ownerId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="bg-gray-100 flex items-center justify-center p-8">
            <img 
               src={book.imageUrl || `https://picsum.photos/seed/${book.id}/400/600`}
               alt={book.title}
               className="max-h-[500px] object-contain rounded-md shadow-md"
            />
          </div>
          {/* Details */}
          <div className="p-8 flex flex-col">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              {book.category?.name}
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-xl text-gray-600 mb-6 font-medium">Автор: {book.author}</p>
            
            <div className="prose text-gray-700 mb-8 flex-1">
              {book.description || 'Описание отсутствует.'}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Владелец</p>
                <Link href={`/users/${book.ownerId}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                  {book.owner?.name}
                </Link>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Добавлено</p>
                <p className="font-medium text-gray-900">{new Date(book.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Actions / Offers section */}
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Предложения по этой книге</h3>
                {(isOwner || user?.role === 'ADMIN' || (user?.role === 'MODERATOR' && user?.moderatedCategoryIds?.includes(book.categoryId))) && (
                   <div className="flex gap-3">
                     <button 
                       onClick={() => router.push(`/books/${book.id}/edit`)}
                       className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                     >
                       Редактировать
                     </button>
                     <button 
                       onClick={async () => {
                         if (confirm('Удалить эту книгу?')) {
                           await fetch(`/api/books/${book.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` } });
                           router.push('/books');
                         }
                       }}
                       className="text-sm font-medium text-red-600 hover:text-red-800"
                     >
                       Удалить
                     </button>
                   </div>
                )}
              </div>
              {book.offers?.length > 0 ? (
                <div className="space-y-3">
                  {book.offers.filter((o:any) => o.status === 'OPEN').map((offer: any) => (
                    <div key={offer.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white shadow-sm hover:border-indigo-300 transition-colors">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-1">
                          {offer.type === 'SALE' ? 'Продажа' : (offer.type === 'RENT' ? 'Аренда' : 'Обмен')}
                        </span>
                        {offer.type === 'SALE' || offer.type === 'RENT' ? (
                           <div>
                             <p className="font-bold text-lg text-gray-900">{offer.price?.toFixed(2)} ₽</p>
                             {offer.type === 'RENT' && offer.rentalPeriod && (
                               <p className="text-xs text-gray-500 mt-1">Срок: {offer.rentalPeriod}</p>
                             )}
                           </div>
                        ) : (
                           <p className="text-sm text-gray-600">Пожелания: {offer.exchangePreferences}</p>
                        )}
                      </div>
                      <button 
                        disabled={isOwner || !user}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title={isOwner ? "Вы не можете откликнуться на свое предложение" : !user ? "Войдите для взаимодействия" : ""}
                        onClick={() => router.push(`/checkout?offerId=${offer.id}`)}
                      >
                        {offer.type === 'EXCHANGE' ? 'Обменяться' : (offer.type === 'RENT' ? 'Арендовать' : 'Купить')}
                      </button>
                    </div>
                  ))}
                  {book.offers.filter((o:any) => o.status === 'OPEN').length === 0 && (
                     <p className="text-sm text-gray-500">На данный момент нет открытых предложений.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Предложений пока нет.</p>
              )}
              
              {isOwner && (
                 <button 
                   onClick={() => router.push(`/books/${book.id}/offers/create`)}
                   className="mt-6 w-full px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition"
                 >
                   Создать новое предложение
                 </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
