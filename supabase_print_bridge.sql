-- Print bridge: orders.printed_at and RLS for role 'printer'
-- Run in Supabase SQL Editor (after creating a user with user_metadata.role = 'printer')

-- 1. Add printed_at for de-dup (set after successful print)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;
COMMENT ON COLUMN orders.printed_at IS 'Set by print bridge after successful print; used to avoid duplicate prints and catch missed orders.';

-- 2. RLS: printer role can view all orders and update printed_at only (app must only update this column)
CREATE POLICY "Printer can view all orders" ON orders
  FOR SELECT USING ((auth.jwt()->'user_metadata'->>'role') = 'printer');

CREATE POLICY "Printer can update orders printed_at" ON orders
  FOR UPDATE USING ((auth.jwt()->'user_metadata'->>'role') = 'printer')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'printer');

-- 3. RLS: printer role can view all order_items (to build receipt)
CREATE POLICY "Printer can view all order items" ON order_items
  FOR SELECT USING ((auth.jwt()->'user_metadata'->>'role') = 'printer');
