import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/src/components/Providers';

export const metadata: Metadata = {
  title: 'Маркетплейс Книг',
  description: 'Покупка, продажа и обмен книг',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
