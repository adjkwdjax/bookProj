CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE offer_type AS ENUM ('SALE', 'RENT', 'EXCHANGE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE offer_status AS ENUM ('OPEN', 'ACCEPTED', 'CANCELLED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'PAID', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(name)
);

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
);

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
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  buyer_phone TEXT,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (amount >= 0)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
$$;

DROP TRIGGER IF EXISTS trg_transactions_require_buyer_phone ON transactions;
CREATE TRIGGER trg_transactions_require_buyer_phone
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION transactions_require_buyer_phone();

CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_offers_book_id ON offers(book_id);
CREATE INDEX IF NOT EXISTS idx_offers_creator_id ON offers(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

INSERT INTO users (id, email, password_hash, name, role, is_banned, avatar_url, created_at, updated_at)
VALUES
  ('admin-1', 'admin@example.com', 'password', 'Admin User', 'ADMIN', FALSE, NULL, NOW(), NOW()),
  ('mod-1', 'moderator@example.com', 'password', 'Moderator User', 'MODERATOR', FALSE, NULL, NOW(), NOW()),
  ('user-1', 'user@example.com', 'password', 'Regular User', 'USER', FALSE, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, moderator_id, created_at)
VALUES
  ('cat-1', 'Фентези', 'mod-1', NOW()),
  ('cat-2', 'Научпоп', NULL, NOW()),
  ('cat-3', 'Программирование', NULL, NOW()),
  ('cat-4', 'История', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO books (id, owner_id, category_id, title, author, description, image_url, published_year, created_at, updated_at)
VALUES
  ('book-1', 'user-1', 'cat-3', 'Чистый код', 'Роберт Мартин', 'Руководство по созданию надежного и понятного кода.', 'https://picsum.photos/seed/cleancode/400/600', 2008, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
  ('book-2', 'admin-1', 'cat-1', 'Мастер и Маргарита', 'Михаил Булгаков', 'Роман Михаила Булгакова, работа над которым началась в конце 1920-х годов.', 'https://picsum.photos/seed/gatsby/400/600', 1967, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO offers (id, book_id, creator_id, type, status, price, description, rent_days, created_at)
VALUES ('offer-1', 'book-1', 'user-1', 'SALE', 'OPEN', 25, 'Продажа книги', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO offers (id, book_id, creator_id, type, status, price, description, rent_days, created_at)
VALUES ('offer-2', 'book-2', 'admin-1', 'EXCHANGE', 'OPEN', NULL, 'Ищу книги по психологии', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
VALUES ('notif-1', 'user-1', 'Добро пожаловать!', 'Добро пожаловать в Маркетплейс Книг.', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;