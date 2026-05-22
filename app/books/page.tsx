'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [booksRes, catRes] = await Promise.all([
          fetch(`/api/books?q=${searchQuery}&categoryId=${selectedCategoryId}`),
          fetch('/api/categories')
        ]);
        const booksData = await booksRes.json();
        const catData = await catRes.json();
        setBooks(booksData);
        setCategories(catData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300); // basic debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategoryId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Каталог книг</h1>
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Поиск книг..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Все категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80">
              <div className="w-full bg-gray-200 aspect-[2/3] rounded-md mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map(book => (
            <Link href={`/books/${book.id}`} key={book.id} className="group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all h-full overflow-hidden flex flex-col">
                 <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
                    <img 
                      src={book.imageUrl || `https://picsum.photos/seed/${book.id}/400/600`} 
                      alt={book.title} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
                    />
                 </div>
                 <div className="p-4 flex-1 flex flex-col">
                   <div className="text-xs text-indigo-600 font-medium mb-1">{book.category?.name}</div>
                   <h3 className="font-semibold text-gray-900 truncate" title={book.title}>{book.title}</h3>
                   <p className="text-sm text-gray-500 mb-2 truncate">{book.author}</p>
                   <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                     <span>Владелец: {book.owner?.name}</span>
                   </div>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Книги не найдены</h3>
          <p className="mt-1 text-gray-500">Попробуйте изменить фильтры или запрос поиска.</p>
        </div>
      )}
    </div>
  );
}

import { BookOpen } from 'lucide-react';
