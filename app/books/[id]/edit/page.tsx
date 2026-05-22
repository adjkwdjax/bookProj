'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/src/store/authStore';

const schema = z.object({
  title: z.string().min(2, 'Название должно быть не короче 2 символов'),
  author: z.string().min(2, 'Имя автора должно быть не короче 2 символов'),
  description: z.string().min(10, 'Описание должно быть не короче 10 символов'),
  categoryId: z.string().min(1, 'Категория обязательна'),
  imageUrl: z.string().optional(),
});

export default function EditBookPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = params.id;
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch(`/api/books/${id}`).then(res => {
        if (!res.ok) throw new Error('Book not found');
        return res.json();
      })
    ]).then(([cats, book]) => {
      setCategories(cats);
      reset({
        title: book.title,
        author: book.author,
        description: book.description,
        categoryId: book.categoryId,
        imageUrl: book.imageUrl || '',
      });
      setFetching(false);
    }).catch(err => {
      setApiError(err.message);
      setFetching(false);
    });
  }, [id, reset]);

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Пожалуйста войтите, чтобы редактировать книгу.</div>;
  }

  if (fetching) {
    return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  }

  const onSubmit = async (data: any) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка при редактировании книги');
      router.push(`/books/${id}`);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full">
       <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-8">
         <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактировать книгу</h1>
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
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
         </form>
       </div>
    </div>
  );
}
