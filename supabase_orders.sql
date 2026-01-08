-- Create Order Status Enum Type
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create Orders Table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status order_status DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT CHECK (char_length(notes) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Orders

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view all orders (Example: whitelist by email or specific role metadata)
-- For simplicity in this demo, we might allow full read for now or check a metadata field.
-- Ideally: auth.jwt() ->> 'email' = 'admin@cloudcafe.com'
-- STRICT POLICY:
-- CREATE POLICY "Admins can view all orders" ON orders
--   FOR SELECT USING (auth.jwt() ->> 'email' = 'demouser2026@test.com'); 

-- RLS Policies for Order Items

-- Users can view items of their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- Users can insert items for their own orders
-- This is tricky because during insert of item, the order must exist and belong to user.
-- Usually accomplished by checks.
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
