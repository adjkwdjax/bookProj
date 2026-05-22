export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Fake hash for mock
  role: Role;
  avatar?: string;
  createdAt: string;
  isBlocked?: boolean;
  moderatedCategoryIds?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl?: string;
  categoryId: string;
  ownerId: string;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
}

export enum OfferType {
  SALE = 'SALE',
  RENT = 'RENT',
  EXCHANGE = 'EXCHANGE',
}

export enum OfferStatus {
  OPEN = 'OPEN',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Offer {
  id: string;
  bookId: string;
  creatorId: string;
  type: OfferType;
  price?: number; // For SELL or RENT
  description?: string;
  rentDays?: number;
  status: OfferStatus;
  createdAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  transactionId: string;
  createdAt: string;
}

export enum TransactionStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Transaction {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  buyerPhone?: string;
  status: TransactionStatus;
  createdAt: string;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
