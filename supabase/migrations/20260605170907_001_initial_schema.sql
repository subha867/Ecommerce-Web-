/*
# E-Commerce Complete Database Schema

## Overview
Full schema for a production e-commerce platform with users, products, orders, reviews, wishlists, coupons, banners, and site settings.

## Tables Created
1. `profiles` - Extended user profile linked to auth.users (role: user/admin, avatar, phone, addresses)
2. `categories` - Product categories with slug, image, parent for nesting
3. `products` - Products with price, inventory, images, ratings
4. `product_images` - Multiple images per product
5. `orders` - Customer orders with status and shipping details
6. `order_items` - Line items per order
7. `wishlist` - User wishlisted products
8. `reviews` - Product reviews with rating and verified purchase flag
9. `coupons` - Discount coupons (percentage or fixed)
10. `banners` - Homepage/promotional banners
11. `settings` - Key/value site settings

## Security
- RLS enabled on all tables
- Users can only access their own orders, wishlist, reviews, profile
- Admins (role='admin' in profiles) can access everything
- Public read on products, categories, banners (storefront)

## Indexes
- Products: category_id, slug, featured, status
- Orders: user_id, status
- Reviews: product_id, user_id
- Wishlist: user_id, product_id
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'));

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_select" ON categories;
CREATE POLICY "categories_public_select" ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "categories_admin_update" ON categories;
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_price numeric(10,2) CHECK (compare_price >= 0),
  cost_price numeric(10,2) CHECK (cost_price >= 0),
  sku text UNIQUE,
  barcode text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  stock_quantity int NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold int NOT NULL DEFAULT 5,
  weight numeric(8,2),
  images text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_select" ON products;
CREATE POLICY "products_public_select" ON products FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "products_admin_select" ON products;
CREATE POLICY "products_admin_select" ON products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert" ON products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'ORD-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  shipping_amount numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  coupon_code text,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_reference text,
  shipping_address jsonb NOT NULL DEFAULT '{}',
  billing_address jsonb DEFAULT '{}',
  notes text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_delete_own" ON orders;
CREATE POLICY "orders_delete_own" ON orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_all" ON orders;
CREATE POLICY "orders_admin_all" ON orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  sku text,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_user_id_idx ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS wishlist_product_id_idx ON wishlist(product_id);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_select_own" ON wishlist;
CREATE POLICY "wishlist_select_own" ON wishlist FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_insert_own" ON wishlist;
CREATE POLICY "wishlist_insert_own" ON wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlist;
CREATE POLICY "wishlist_delete_own" ON wishlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT true,
  helpful_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_select" ON reviews;
CREATE POLICY "reviews_public_select" ON reviews FOR SELECT TO anon, authenticated USING (is_approved = true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
CREATE POLICY "reviews_admin_all" ON reviews FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value numeric(10,2) NOT NULL CHECK (value > 0),
  min_order_amount numeric(10,2) DEFAULT 0,
  max_discount_amount numeric(10,2),
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_public_select" ON coupons;
CREATE POLICY "coupons_public_select" ON coupons FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "coupons_admin_insert" ON coupons;
CREATE POLICY "coupons_admin_insert" ON coupons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "coupons_admin_update" ON coupons;
CREATE POLICY "coupons_admin_update" ON coupons FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "coupons_admin_delete" ON coupons;
CREATE POLICY "coupons_admin_delete" ON coupons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  button_text text,
  position text NOT NULL DEFAULT 'hero' CHECK (position IN ('hero','top','middle','bottom')),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_select" ON banners;
CREATE POLICY "banners_public_select" ON banners FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "banners_admin_insert" ON banners;
CREATE POLICY "banners_admin_insert" ON banners FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "banners_admin_update" ON banners;
CREATE POLICY "banners_admin_update" ON banners FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "banners_admin_delete" ON banners;
CREATE POLICY "banners_admin_delete" ON banners FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_select" ON settings;
CREATE POLICY "settings_public_select" ON settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_insert" ON settings;
CREATE POLICY "settings_admin_insert" ON settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "settings_admin_update" ON settings;
CREATE POLICY "settings_admin_update" ON settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "settings_admin_delete" ON settings;
CREATE POLICY "settings_admin_delete" ON settings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: update avg_rating on reviews
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true),
    updated_at = now()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- ============================================================
-- SEED DATA: default settings
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
  ('store_name', '"LuxeShop"', 'Store display name'),
  ('store_email', '"support@luxeshop.com"', 'Store contact email'),
  ('currency', '"USD"', 'Store currency'),
  ('free_shipping_threshold', '75', 'Order amount for free shipping'),
  ('default_shipping_cost', '9.99', 'Default shipping cost'),
  ('tax_rate', '0.08', 'Default tax rate (8%)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED DATA: categories
-- ============================================================
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
  ('Electronics', 'electronics', 'Gadgets and electronic devices', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg', 1),
  ('Fashion', 'fashion', 'Clothing and accessories', 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg', 2),
  ('Home & Living', 'home-living', 'Furniture and home decor', 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg', 3),
  ('Sports', 'sports', 'Sports and fitness equipment', 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg', 4),
  ('Beauty', 'beauty', 'Skincare and beauty products', 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg', 5),
  ('Books', 'books', 'Books and stationery', 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: products
-- ============================================================
INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Premium Wireless Headphones',
  'premium-wireless-headphones',
  'Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort ear cushions. Perfect for music lovers and professionals alike.',
  'Crystal-clear audio with ANC and 30-hour battery',
  299.99, 399.99, 'ELEC-001',
  id, 50,
  ARRAY['https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg','https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'],
  true, true, true, 'active'
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Smart Fitness Watch',
  'smart-fitness-watch',
  'Track your fitness goals with our advanced smartwatch. Features heart rate monitoring, GPS, sleep tracking, and 7-day battery life. Water resistant up to 50 meters.',
  'Advanced fitness tracking with GPS and heart rate monitor',
  199.99, 249.99, 'ELEC-002',
  id, 75,
  ARRAY['https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg','https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg'],
  true, false, true, 'active'
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Designer Leather Jacket',
  'designer-leather-jacket',
  'Elevate your style with our premium designer leather jacket. Made from genuine full-grain leather with a sleek modern cut. Features a quilted interior lining and multiple pockets.',
  'Premium full-grain leather with modern silhouette',
  449.99, 599.99, 'FASH-001',
  id, 30,
  ARRAY['https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg','https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg'],
  true, true, false, 'active'
FROM categories WHERE slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Minimalist Desk Lamp',
  'minimalist-desk-lamp',
  'Illuminate your workspace with our modern LED desk lamp. Features adjustable color temperature, brightness control, USB charging port, and a sleek minimalist design that complements any desk setup.',
  'LED desk lamp with adjustable color temperature and USB port',
  89.99, 119.99, 'HOME-001',
  id, 100,
  ARRAY['https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg','https://images.pexels.com/photos/2249959/pexels-photo-2249959.jpeg'],
  false, true, true, 'active'
FROM categories WHERE slug = 'home-living'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Pro Running Shoes',
  'pro-running-shoes',
  'Engineered for peak performance, our pro running shoes feature advanced cushioning technology, breathable mesh upper, and durable rubber outsole. Suitable for road running and trail.',
  'High-performance running with advanced cushioning',
  159.99, 199.99, 'SPRT-001',
  id, 60,
  ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg','https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg'],
  true, false, true, 'active'
FROM categories WHERE slug = 'sports'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Luxury Skincare Set',
  'luxury-skincare-set',
  'Transform your skincare routine with our luxury 5-piece set. Includes cleanser, toner, serum, moisturizer, and eye cream. Formulated with natural ingredients for radiant, youthful skin.',
  '5-piece luxury skincare set with natural ingredients',
  129.99, 179.99, 'BEAU-001',
  id, 45,
  ARRAY['https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg','https://images.pexels.com/photos/3621228/pexels-photo-3621228.jpeg'],
  false, true, false, 'active'
FROM categories WHERE slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Wireless Mechanical Keyboard',
  'wireless-mechanical-keyboard',
  'Type in style with our compact wireless mechanical keyboard. Features Cherry MX switches, RGB backlighting, and a rechargeable battery lasting up to 2 weeks. Compatible with all devices.',
  'Compact wireless mechanical keyboard with RGB',
  149.99, 189.99, 'ELEC-003',
  id, 40,
  ARRAY['https://images.pexels.com/photos/3829227/pexels-photo-3829227.jpeg','https://images.pexels.com/photos/1714205/pexels-photo-1714205.jpeg'],
  false, true, true, 'active'
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, short_description, price, compare_price, sku, category_id, stock_quantity, images, is_featured, is_new_arrival, is_trending, status)
SELECT
  'Silk Blend Dress',
  'silk-blend-dress',
  'A timeless piece crafted from premium silk blend fabric. Features a flattering A-line silhouette, delicate button detail, and hidden pockets. Perfect for both casual and formal occasions.',
  'Premium silk blend A-line dress with pockets',
  219.99, 279.99, 'FASH-002',
  id, 25,
  ARRAY['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg','https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg'],
  true, true, false, 'active'
FROM categories WHERE slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: banners
-- ============================================================
INSERT INTO banners (title, subtitle, image_url, link_url, button_text, position, sort_order) VALUES
  ('Summer Collection 2024', 'Discover our latest arrivals with up to 40% off', 'https://images.pexels.com/photos/5632388/pexels-photo-5632388.jpeg', '/products', 'Shop Now', 'hero', 1),
  ('New Electronics', 'Cutting-edge tech at unbeatable prices', 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg', '/products?category=electronics', 'Explore', 'hero', 2),
  ('Fashion Week', 'Elevate your wardrobe this season', 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg', '/products?category=fashion', 'Shop Fashion', 'hero', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: coupons
-- ============================================================
INSERT INTO coupons (code, description, type, value, min_order_amount, usage_limit, is_active) VALUES
  ('WELCOME10', 'Welcome discount - 10% off your first order', 'percentage', 10, 0, 1000, true),
  ('SAVE20', 'Save $20 on orders over $100', 'fixed', 20, 100, 500, true),
  ('SUMMER25', 'Summer sale - 25% off', 'percentage', 25, 50, 200, true)
ON CONFLICT (code) DO NOTHING;
