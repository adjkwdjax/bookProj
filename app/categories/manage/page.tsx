'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import Link from 'next/link';

export default function ManageCategories() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [categories, setCategories] = useState<{id:string; name:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  useEffect(() => {
    if (!token || !canModerate) {
      router.push('/');
      return;
    }
    loadCategories();
  }, [token, user]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      if (res.ok) {
        setNewCatName('');
        loadCategories();
      } else {
        console.error('Ошибка при создании');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingCatName.trim() })
      });
      if (res.ok) {
        setEditingCatId(null);
        setEditingCatName('');
        loadCategories();
      } else {
        console.error('Ошибка при обновлении');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
           'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadCategories();
      } else {
        console.error('Ошибка при удалении');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!canModerate) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Управление категориями</h1>
        <Link href="/profile" className="text-indigo-600 hover:underline">Вернуться в профиль</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Создать новую категорию</h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Название категории"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
          />
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleCreate}
            disabled={!newCatName.trim()}
          >
            Создать
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {categories.map(c => (
            <li key={c.id} className="p-4 flex items-center justify-between">
              {editingCatId === c.id ? (
                <div className="flex items-center gap-4 flex-1 mr-4">
                  <input
                     type="text"
                     value={editingCatName}
                     onChange={e => setEditingCatName(e.target.value)}
                     className="flex-1 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button onClick={() => handleUpdate(c.id)} className="text-green-600 font-medium hover:underline">Сохранить</button>
                  <button onClick={() => { setEditingCatId(null); setEditingCatName(''); }} className="text-gray-500 font-medium hover:underline">Отмена</button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <div className="flex gap-4 text-sm font-medium">
                    <button 
                      onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }}
                      className="text-indigo-600 hover:underline"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {!loading && categories.length === 0 && (
            <li className="p-4 text-gray-500 text-center">Нет категорий</li>
          )}
          {loading && (
            <li className="p-4 text-gray-500 text-center">Загрузка...</li>
          )}
        </ul>
      </div>
    </div>
  );
}
