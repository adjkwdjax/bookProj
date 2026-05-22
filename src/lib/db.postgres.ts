import { Pool, PoolClient, QueryResult } from 'pg';

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (!host || !port || !dbName || !user || !password) return null;

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;
}

export function getDb() {
  if (!pool) {
    const connectionString = buildConnectionString();
    if (!connectionString) {
      throw new Error('DATABASE_URL or DB_* variables are required for PostgreSQL connection');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

async function seedIfEmpty(client: PoolClient) {
  const usersCount = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  if (Number(usersCount.rows[0]?.count ?? 0) > 0) return;

  await client.query(`
    INSERT INTO users (id, email, password_hash, name, role, is_banned, avatar_url, created_at, updated_at)
    VALUES
      ('admin-1', 'admin@example.com', 'password', 'Admin User', 'ADMIN', FALSE, NULL, NOW(), NOW()),
      ('mod-1', 'moderator@example.com', 'password', 'Moderator User', 'MODERATOR', FALSE, NULL, NOW(), NOW()),
      ('user-1', 'user@example.com', 'password', 'Regular User', 'USER', FALSE, NULL, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO categories (id, name, moderator_id, created_at)
    VALUES
      ('cat-1', 'Фентези', 'mod-1', NOW()),
      ('cat-2', 'Научпоп', NULL, NOW()),
      ('cat-3', 'Программирование', NULL, NOW()),
      ('cat-4', 'История', NULL, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO books (id, owner_id, category_id, title, author, description, image_url, published_year, created_at, updated_at)
    VALUES
      ('book-1', 'user-1', 'cat-3', 'Чистый код', 'Роберт Мартин', 'Руководство по созданию надежного и понятного кода.', 'https://picsum.photos/seed/cleancode/400/600', 2008, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
      ('book-2', 'admin-1', 'cat-1', 'Мастер и Маргарита', 'Михаил Булгаков', 'Роман Михаила Булгакова, работа над которым началась в конце 1920-х годов.', 'https://picsum.photos/seed/gatsby/400/600', 1967, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours')
    ON CONFLICT (id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO offers (id, book_id, creator_id, type, status, price, description, rent_days, created_at)
    VALUES ('offer-1', 'book-1', 'user-1', 'SALE', 'OPEN', 25, 'Продажа книги', NULL, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO offers (id, book_id, creator_id, type, status, price, description, rent_days, created_at)
    VALUES ('offer-2', 'book-2', 'admin-1', 'EXCHANGE', 'OPEN', NULL, 'Ищу книги по психологии', NULL, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
    VALUES ('notif-1', 'user-1', 'Добро пожаловать!', 'Добро пожаловать в Маркетплейс Книг.', FALSE, NOW())
    ON CONFLICT (id) DO NOTHING
  `);
}

export async function ensureDbReady() {
  if (!initPromise) {
    initPromise = (async () => {
      const client = await getDb().connect();
      try {
        await client.query('BEGIN');

        await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

        await client.query(`
          DO $$
          BEGIN
            CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END $$;
        `);

        await client.query(`
          DO $$
          BEGIN
            CREATE TYPE offer_type AS ENUM ('SALE', 'RENT', 'EXCHANGE');
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END $$;
        `);

        await client.query(`
          DO $$
          BEGIN
            CREATE TYPE offer_status AS ENUM ('OPEN', 'ACCEPTED', 'CANCELLED', 'COMPLETED');
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END $$;
        `);

        await client.query(`
          DO $$
          BEGIN
            CREATE TYPE transaction_status AS ENUM ('PENDING', 'PAID', 'COMPLETED', 'CANCELLED');
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END $$;
        `);

        await client.query(`
          DO $$
          BEGIN
            CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END $$;
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role user_role NOT NULL DEFAULT 'USER',
            is_banned BOOLEAN NOT NULL DEFAULT FALSE,
            avatar_url TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(name)
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS books (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            author TEXT,
            description TEXT,
            image_url TEXT,
            published_year INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS offers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
            creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type offer_type NOT NULL,
            status offer_status NOT NULL DEFAULT 'OPEN',
            price NUMERIC(10,2),
            description TEXT,
            rent_days INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CHECK (price IS NULL OR price >= 0),
            CHECK (rent_days IS NULL OR rent_days > 0)
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
            amount NUMERIC(10,2) NOT NULL,
            status payment_status NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CHECK (amount >= 0)
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            offer_id UUID NOT NULL UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
            buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            buyer_phone TEXT,
            status transaction_status NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);

        await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_phone TEXT`);

        await client.query(`
          CREATE OR REPLACE FUNCTION transactions_require_buyer_phone()
          RETURNS trigger
          LANGUAGE plpgsql
          AS $$
          BEGIN
            IF NEW.buyer_phone IS NULL OR btrim(NEW.buyer_phone) = '' THEN
              RAISE EXCEPTION 'buyer_phone is required';
            END IF;

            RETURN NEW;
          END;
          $$
        `);

        await client.query(`DROP TRIGGER IF EXISTS trg_transactions_require_buyer_phone ON transactions`);
        await client.query(`
          CREATE TRIGGER trg_transactions_require_buyer_phone
          BEFORE INSERT ON transactions
          FOR EACH ROW
          EXECUTE FUNCTION transactions_require_buyer_phone()
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_offers_book_id ON offers(book_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_offers_creator_id ON offers(creator_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

        await seedIfEmpty(client);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    })();
  }

  await initPromise;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  await ensureDbReady();
  return getDb().query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureDbReady();
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    avatar: row.avatar_url || undefined,
    createdAt: toIsoString(row.created_at),
    isBlocked: !!row.is_banned,
  };
}

export function mapCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    moderatorId: row.moderator_id || undefined,
  };
}

export function mapBook(row: any) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    imageUrl: row.image_url || undefined,
    categoryId: row.category_id,
    ownerId: row.owner_id,
    publishedYear: row.published_year ?? undefined,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export function mapOffer(row: any) {
  return {
    id: row.id,
    bookId: row.book_id,
    creatorId: row.creator_id,
    type: row.type,
    price: row.price != null ? Number(row.price) : undefined,
    description: row.description || undefined,
    rentDays: row.rent_days != null ? Number(row.rent_days) : undefined,
    status: row.status,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapPayment(row: any) {
  return {
    id: row.id,
    amount: Number(row.amount),
    status: row.status,
    transactionId: row.transaction_id,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapTransaction(row: any) {
  return {
    id: row.id,
    offerId: row.offer_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    buyerPhone: row.buyer_phone || undefined,
    status: row.status,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapNotification(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    read: !!row.is_read,
    createdAt: toIsoString(row.created_at),
  };
}

export function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}
