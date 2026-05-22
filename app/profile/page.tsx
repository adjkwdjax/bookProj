'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { Book, Tag, ShoppingBag, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('books');

  useEffect(() => {
    fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
    })
    .then(res => res.json())
    .then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const handleRespond = async (txId: string, action: 'ACCEPT'|'REJECT') => {
    try {
      const res = await fetch(`/api/transactions/${txId}/respond`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${useAuthStore.getState().token}` },
         body: JSON.stringify({ action })
      });
      if (res.ok) {
         const d = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` } }).then(r=>r.json());
         setData(d);
      } else {
         console.error('Ошибка при обработке');
      }
    } catch(e) { console.error(e); }
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Пожалуйста войтите, чтобы посмотреть профиль.</div>;
  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка профиля...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full flex flex-col md:flex-row gap-8">
       {/* Sidebar */}
       <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900">{user.name}</h2>
            <p className="text-center text-gray-500 text-sm mb-6">{user.email}</p>
            
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 ml-1">Меню</p>
            <nav className="space-y-1">
               <button onClick={() => setActiveTab('books')} className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'books' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                 <Book className="mr-3 h-5 w-5" /> Мои Книги
               </button>
               <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'offers' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                 <Tag className="mr-3 h-5 w-5" /> Предложения
               </button>
               <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'transactions' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                 <ShoppingBag className="mr-3 h-5 w-5" /> Сделки
               </button>
               <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'payments' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                 <CreditCard className="mr-3 h-5 w-5" /> Платежи
               </button>
            </nav>
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
          {activeTab === 'books' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">Мои добавленные книги</h3>
                 <Link href="/books/create" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">Добавить</Link>
              </div>
              {data.books.length === 0 ? <p className="text-gray-500">Вы еще не добавили ни одной книги.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.books.map((b:any) => (
                    <div key={b.id} className="border border-gray-100 rounded-lg p-4 flex gap-4 hover:shadow-md transition">
                      <img src={b.imageUrl || `https://picsum.photos/seed/${b.id}/50/75`} className="w-12 h-16 object-cover rounded bg-gray-100" />
                      <div>
                        <Link href={`/books/${b.id}`} className="font-semibold text-gray-900 hover:text-indigo-600">{b.title}</Link>
                        <p className="text-sm text-gray-500">{b.category?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Мои активные предложения</h3>
              {data.offers.length === 0 ? <p className="text-gray-500">Предложений не найдено.</p> : (
                <div className="space-y-4">
                  {data.offers.map((o:any) => (
                    <div key={o.id} className="border border-gray-100 rounded-lg p-4 flex justify-between items-center bg-gray-50">
                      <div>
                        <Link href={`/books/${o.bookId}`} className="font-semibold">{o.book?.title || 'Неизвестная книга'}</Link>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium mr-2">{o.type === 'SALE' ? 'Продажа' : 'Обмен'}</span>
                          {o.price ? `${o.price.toFixed(2)} ₽` : o.exchangePreferences}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${o.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {o.status === 'OPEN' ? 'Открыто' : (o.status === 'ACCEPTED' ? 'Принято' : (o.status === 'REJECTED' ? 'Отклонено' : 'Завершено'))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-xl font-bold mb-6">Недавние сделки</h3>
              {data.transactions.length === 0 ? <p className="text-gray-500">Сделок не найдено.</p> : (
                <div className="space-y-3">
                  {data.transactions.map((t:any) => (
                    <div key={t.id} className="border border-gray-100 rounded-lg p-4 text-sm flex justify-between">
                       <div>
                         <p className="font-medium text-gray-900">С кем: {t.otherParty}</p>
                         <p className="text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                           {t.isSeller && t.buyerPhone && (
                             <p className="mt-2 text-gray-700 bg-gray-50 p-2 rounded">
                               Телефон покупателя: {t.buyerPhone}
                             </p>
                           )}
                         {t.exchangeMessage && <p className="mt-2 text-gray-700 bg-gray-50 p-2 rounded">Сообщение: {t.exchangeMessage}</p>}
                       </div>
                       <div className="text-right flex flex-col items-end gap-2">
                         <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">{t.status === 'PENDING' ? 'В ожидании' : (t.status === 'COMPLETED' ? 'Завершено' : 'Отменено')}</span>
                         {t.status === 'PENDING' && t.isSeller && (
                            <div className="flex gap-2 mt-2">
                               <button onClick={() => handleRespond(t.id, 'ACCEPT')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Принять</button>
                               <button onClick={() => handleRespond(t.id, 'REJECT')} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Отклонить</button>
                            </div>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-xl font-bold mb-6">История платежей</h3>
               {data.payments.length === 0 ? <p className="text-gray-500">Платежей не найдено.</p> : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="pb-2">Дата</th>
                      <th className="pb-2">Сумма</th>
                      <th className="pb-2">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p:any) => (
                      <tr key={p.id} className="border-b last:border-0 border-gray-50">
                        <td className="py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 font-medium">{p.amount.toFixed(2)} ₽</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.status === 'SUCCESS' ? 'Успешно' : 'Ошибка'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               )}
            </div>
          )}
       </div>
    </div>
  );
}
