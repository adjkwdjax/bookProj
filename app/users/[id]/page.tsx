'use client';

import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warningMsg, setWarningMsg] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  if (!data || !data.user) return <div className="p-8 text-center text-red-500">Пользователь не найден</div>;

  const targetUser = data.user;
  const isModerator = user?.role === 'MODERATOR';
  const isAdmin = user?.role === 'ADMIN';
  const canModerate = isAdmin || isModerator;

  const handleWarn = async () => {
    if (!warningMsg) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/users/${id}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: warningMsg })
      });
      if (!res.ok) throw new Error('Ошибка');
      setWarningMsg('');
      // Update local state to show message was sent if you want, or refetch
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlock = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/users/${id}/block`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка');
      router.push('/books');
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6 mb-8">
        <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 flex-shrink-0">
          {targetUser.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{targetUser.name}</h1>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {targetUser.role === 'ADMIN' ? 'Администратор' : targetUser.role === 'MODERATOR' ? 'Модератор' : 'Пользователь'}
          </div>
          {targetUser.isBlocked && (
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
              Заблокирован
            </div>
          )}
        </div>
      </div>

      {canModerate && targetUser.role === 'USER' && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-8">
          <h3 className="text-lg font-bold text-red-800 mb-4">Действия модератора</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input 
              type="text" 
              placeholder="Причина предупреждения..."
              value={warningMsg}
              onChange={e => setWarningMsg(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
            />
            <button onClick={handleWarn} disabled={isActionLoading} className="px-4 py-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600 disabled:opacity-50">Выдать Warn</button>
            <button onClick={handleBlock} disabled={isActionLoading || targetUser.isBlocked} className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50">Заблокировать</button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Книги пользователя</h2>
      {data.books.length === 0 ? (
        <p className="text-gray-500">У пользователя пока нет книг.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.books.map((b: any) => (
             <Link key={b.id} href={`/books/${b.id}`} className="block group">
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group-hover:shadow-md transition">
                  <div className="h-48 bg-gray-100 relative">
                    <img src={b.imageUrl || `https://picsum.photos/seed/${b.id}/400/300`} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">{b.title}</h3>
                    <p className="text-sm text-gray-500">{b.category?.name}</p>
                  </div>
               </div>
             </Link>
          ))}
        </div>
      )}
    </div>
  );
}
