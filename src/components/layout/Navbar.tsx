'use client';

import Link from 'next/link';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'next/navigation';
import { Bell, Book, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setNotifications(data);
        });
    }
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/books" className="border-transparent text-gray-500 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Каталог
              </Link>
              {isAuthenticated && (
                <Link href="/books/create" className="border-transparent text-gray-500 hover:border-indigo-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Добавить книгу
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="relative">
                  <button onClick={() => { setNotifsOpen(!notifsOpen); setDropdownOpen(false); }} className="p-1 rounded-full text-gray-400 hover:text-gray-500 relative focus:outline-none">
                    <span className="sr-only">Посмотреть уведомления</span>
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
                  </button>

                  {notifsOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b text-sm font-semibold text-gray-700">Уведомления</div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-gray-500 text-center">Нет уведомлений</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} onClick={() => markAsRead(n.id)} className={`px-4 py-3 text-sm border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                            <p className="font-medium text-gray-900">{n.title}</p>
                            <p className="text-gray-500 mt-0.5">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifsOpen(false); }}
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Открыть меню пользователя</span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b text-sm text-gray-700">
                        <div className="font-semibold">{user?.name}</div>
                        <div className="text-gray-500 text-xs">{user?.email}</div>
                      </div>
                      <Link href="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Ваш профиль
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100">
                          Панель администратора
                        </Link>
                      )}
                      {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                        <Link href="/categories/manage" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100">
                          Управление категориями
                        </Link>
                      )}
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100">
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link href="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Войти</Link>
                <Link href="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium">Регистрация</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}