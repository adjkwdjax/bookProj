'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { Navbar } from './layout/Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore(state => state.init);
  const isLoading = useAuthStore(state => state.isLoading);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  if (!mounted || isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
}
