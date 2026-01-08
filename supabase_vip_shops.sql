-- VIP Shop Payment System Migration

-- Create vip_shops table
CREATE TABLE IF NOT EXISTS vip_shops (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shop_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vip_shops ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read VIP shops list
CREATE POLICY "Anyone can read vip shops" ON vip_shops
  FOR SELECT USING (true);

-- Insert sample VIP shops
INSERT INTO vip_shops (shop_name) VALUES 
  ('Cloud Cafe HQ'),
  ('Partner Shop A')
ON CONFLICT (shop_name) DO NOTHING;

-- Add payment_method column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online' 
CHECK (payment_method IN ('online', 'in-store'));

-- Add comment for clarity
COMMENT ON COLUMN orders.payment_method IS 'Payment method: online or in-store (VIP only)';
