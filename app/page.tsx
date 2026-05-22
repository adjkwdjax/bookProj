import Link from 'next/link';
import { ArrowRight, BookOpen, Repeat, ShoppingCart } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Маркетплейс для <span className="text-indigo-600">любителей книг</span>.
          </h1>
          <p className="max-w-2xl text-xl text-gray-500 mb-10">
            Покупайте, продавайте или обменивайтесь любимыми книгами с читателями по всему миру. Безопасные сделки, проверенные пользователи и сообщество библиофилов.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/books" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg">
              Смотреть каталог <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg">
              Бесплатная регистрация
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Купить книги</h3>
              <p className="text-gray-500 text-sm">Находите подержанные сокровища или новинки по выгодным ценам.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Продать книги</h3>
              <p className="text-gray-500 text-sm">Найдите новый дом для прочитанных книг и легко зарабатывайте.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Сделать обмен</h3>
              <p className="text-gray-500 text-sm">Обменивайтесь книгами напрямую с другими пользователями, чтобы постоянно обновлять свою библиотеку.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
