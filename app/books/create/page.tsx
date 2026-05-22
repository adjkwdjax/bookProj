'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';

const schema = z.object({
  title: z.string().min(2, 'Название должно быть не короче 2 символов'),
  author: z.string().min(2, 'Имя автора должно быть не короче 2 символов'),
  description: z.string().min(10, 'Описание должно быть не короче 10 символов'),
  categoryId: z.string().min(1, 'Категория обязательна'),
  imageUrl: z.string().optional(),
});

export default function CreateBookPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Пожалуйста войтите, чтобы добавить книгу.</div>;
  }

  const onSubmit = async (data: any) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка при добавлении книги');
      router.push(`/books/${json.id}`);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full">
       <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-8">
         <h1 className="text-2xl font-bold text-gray-900 mb-6">Добавить новую книгу</h1>
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
           {apiError && <div className="text-red-500 text-sm">{apiError}</div>}
           <div>
              <label className="block text-sm font-medium text-gray-700">Название</label>
              <input {...register('title')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              {errors.title?.message && <p className="text-red-500 text-xs mt-1">{String(errors.title.message)}</p>}
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">Автор</label>
              <input {...register('author')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              {errors.author?.message && <p className="text-red-500 text-xs mt-1">{String(errors.author.message)}</p>}
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">Категория</label>
              <select {...register('categoryId')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white">
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId?.message && <p className="text-red-500 text-xs mt-1">{String(errors.categoryId.message)}</p>}
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">URL картинки (необязательно)</label>
              <input {...register('imageUrl')} placeholder="https://example.com/image.jpg" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              {errors.imageUrl?.message && <p className="text-red-500 text-xs mt-1">{String(errors.imageUrl.message)}</p>}
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">Описание</label>
              <textarea {...register('description')} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              {errors.description?.message && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
           </div>
           
           <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Добавление...' : 'Добавить книгу'}
            </button>
         </form>
       </div>
    </div>
  );
}
