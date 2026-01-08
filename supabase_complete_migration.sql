-- ==========================================
-- Cloud Cafe Complete Database Migration
-- ==========================================
-- Run this ONCE in Supabase SQL Editor

-- 1. Create Orders Table
-- ==========================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  payment_method TEXT DEFAULT 'online' CHECK (payment_method IN ('online', 'in-store')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders (using email whitelist)
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('demouser2026@test.com', 'admin@cloudcafe.com')
  );

-- 2. Create Order Items Table
-- ==========================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view items of their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert items for their own orders
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('demouser2026@test.com', 'admin@cloudcafe.com')
  );

-- 3. Create VIP Shops Table
-- ==========================================

CREATE TABLE IF NOT EXISTS vip_shops (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shop_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for vip_shops
ALTER TABLE vip_shops ENABLE ROW LEVEL SECURITY;

-- Anyone can read VIP shops list
CREATE POLICY "Anyone can read vip shops" ON vip_shops
  FOR SELECT USING (true);

-- Insert sample VIP shops
INSERT INTO vip_shops (shop_name) VALUES 
  ('Cloud Cafe HQ'),
  ('Partner Shop A')
ON CONFLICT (shop_name) DO NOTHING;

-- 4. Add Comments for Documentation
-- ==========================================

COMMENT ON TABLE orders IS 'Customer orders with payment method support';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: online or in-store (VIP only)';
COMMENT ON TABLE order_items IS 'Items in each order';
COMMENT ON TABLE vip_shops IS 'Whitelist of VIP shops eligible for in-store payment';

-- ==========================================
-- Migration Complete!
-- ==========================================
-- You can now:
-- 1. Add/remove VIP shops in Table Editor
-- 2. View orders in Table Editor
-- 3. Users can register with shop_name
-- 4. VIP users can choose payment method
