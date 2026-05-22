import {
  User,
  Book,
  Category,
  Offer,
  Transaction,
  Payment,
  Notification,
  Role,
  BookStatus,
  OfferType,
  OfferStatus,
} from '@/src/types';
import { v4 as uuidv4 } from 'uuid';

interface Database {
  users: User[];
  categories: Category[];
  books: Book[];
  offers: Offer[];
  transactions: Transaction[];
  payments: Payment[];
  notifications: Notification[];
}

const initialDb: Database = {
  users: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Администратор',
      email: 'admin@example.com',
      passwordHash: 'password', // mock password
      role: Role.ADMIN,
      createdAt: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Модератор Фантастики',
      email: 'moderator@example.com',
      passwordHash: 'password',
      role: Role.MODERATOR,
      moderatedCategoryIds: ['cat-1'],
      createdAt: new Date().toISOString(),
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Иван Иванов',
      email: 'john@example.com',
      passwordHash: 'password',
      role: Role.USER,
      createdAt: new Date().toISOString(),
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Мария Смирнова',
      email: 'jane@example.com',
      passwordHash: 'password',
      role: Role.USER,
      createdAt: new Date().toISOString(),
    },
  ],
  categories: [
    { id: '55555555-5555-5555-5555-555555555555', name: 'Фантастика', slug: 'fiction' },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Наука', slug: 'science' },
    { id: '77777777-7777-7777-7777-777777777777', name: 'Программирование', slug: 'programming' },
    { id: '88888888-8888-8888-8888-888888888888', name: 'Дизайн', slug: 'design' },
  ],
  books: [
    {
      id: 'book-1',
      title: 'Чистый код',
      author: 'Роберт Мартин',
      description: 'Руководство по созданию надежного и понятного кода.',
      categoryId: 'cat-3',
      ownerId: 'user-1',
      status: BookStatus.AVAILABLE,
      imageUrl: 'https://picsum.photos/seed/cleancode/400/600',
      createdAt: new Date(Date.now() - 10000000).toISOString(),
      updatedAt: new Date(Date.now() - 10000000).toISOString(),
    },
    {
      id: 'book-2',
      title: 'Мастер и Маргарита',
      author: 'Михаил Булгаков',
      description: 'Роман Михаила Булгакова, работа над которым началась в конце 1920-х годов.',
      categoryId: 'cat-1',
      ownerId: 'user-2',
      status: BookStatus.AVAILABLE,
      imageUrl: 'https://picsum.photos/seed/gatsby/400/600',
      createdAt: new Date(Date.now() - 20000000).toISOString(),
      updatedAt: new Date(Date.now() - 20000000).toISOString(),
    },
  ],
  offers: [
    {
      id: 'offer-1',
      bookId: 'book-1',
      ownerId: 'user-1',
      type: OfferType.SELL,
      price: 25.0,
      status: OfferStatus.OPEN,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'offer-2',
      bookId: 'book-2',
      ownerId: 'user-2',
      type: OfferType.EXCHANGE,
      exchangePreferences: 'Ищу книги по психологии',
      status: OfferStatus.OPEN,
      createdAt: new Date().toISOString(),
    },
  ],
  transactions: [],
  payments: [],
  notifications: [
    {
      id: 'notif-1',
      userId: 'user-1',
      title: 'Добро пожаловать!',
      message: 'Добро пожаловать в Маркетплейс Книг.',
      type: 'INFO' as any,
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

// Global cache to persist state across Next.js API reloads in dev mode
const globalAny: any = global;
if (!globalAny.__db) {
  globalAny.__db = structuredClone(initialDb);
}

export const db = {
  get data(): Database {
    return globalAny.__db;
  },
  reset() {
    globalAny.__db = structuredClone(initialDb);
  },
};
