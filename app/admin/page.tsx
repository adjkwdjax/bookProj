'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { Users, BookOpen, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [updatingParams, setUpdatingParams] = useState(false);

  useEffect(() => {
    fetch('/api/admin', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [token]);

  const loadAdminData = () => {
    fetch('/api/admin', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(d => setData(d));
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setUpdatingParams(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole, moderatedCategoryIds: newRole === 'MODERATOR' ? selectedCategories : undefined })
      });
      if (res.ok) {
        setSelectedUser(null);
        loadAdminData();
      } else {
        console.error('Ошибка при обновлении');
      }
    } catch(e) { console.error(e); }
    setUpdatingParams(false);
  };

  if (!user || user.role !== 'ADMIN') return <div className="p-8 text-center text-red-500">Доступ запрещен</div>;
  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка данных администратора...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Панель администратора</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Пользователи</p>
               <p className="text-2xl font-bold text-gray-900">{data?.users?.length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Книги</p>
               <p className="text-2xl font-bold text-gray-900">{data?.books?.length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Activity className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Предложения</p>
               <p className="text-2xl font-bold text-gray-900">{data?.offers?.length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Платежи</p>
               <p className="text-2xl font-bold text-gray-900">{data?.payments?.length}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
               <h3 className="font-bold text-gray-900">Недавние пользователи</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
               <ul className="divide-y divide-gray-100">
                 {data.users.slice(0,10).map((u:any) => (
                   <li key={u.id} className="py-3 flex justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-900">{u.name} <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">{u.role}</span></p>
                       <p className="text-xs text-gray-500">{u.email}</p>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                       <button onClick={() => { setSelectedUser(u); setNewRole(u.role); setSelectedCategories(u.moderatedCategoryIds || []); }} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100">Управление</button>
                     </div>
                   </li>
                 ))}
               </ul>
            </div>
         </div>
         
         <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
               <h3 className="font-bold text-gray-900">Недавние транзакции</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
               <ul className="divide-y divide-gray-100">
                 {data.transactions.slice(0,10).map((t:any) => (
                   <li key={t.id} className="py-3 flex justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-900">Offer {t.offerId.substring(0,8)}</p>
                       <p className="text-xs text-gray-500">{t.status}</p>
                     </div>
                     <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                   </li>
                 ))}
               </ul>
            </div>
         </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
             <h3 className="text-xl font-bold text-gray-900 mb-4">Управление пользователем: {selectedUser.name}</h3>
             
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
               <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900">
                 <option value="USER">Пользователь</option>
                 <option value="MODERATOR">Модератор</option>
                 <option value="ADMIN">Администратор</option>
               </select>
             </div>

             {newRole === 'MODERATOR' && (
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Модерируемые категории</label>
                 <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded">
                    {data.categories?.map((c:any) => (
                      <label key={c.id} className="flex items-center text-gray-800">
                         <input type="checkbox" checked={selectedCategories.includes(c.id)} onChange={(e) => {
                           if (e.target.checked) setSelectedCategories([...selectedCategories, c.id]);
                           else setSelectedCategories(selectedCategories.filter(id => id !== c.id));
                         }} className="mr-2" />
                         <span className="text-sm">{c.name}</span>
                      </label>
                    ))}
                 </div>
               </div>
             )}

             <div className="flex justify-end gap-3 mt-6">
               <button onClick={() => setSelectedUser(null)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Отмена</button>
               <button onClick={handleUpdateRole} disabled={updatingParams} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Сохранить</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
