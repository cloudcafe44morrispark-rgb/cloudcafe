-- Worldpay Integration Migration
-- Add payment fields to orders table

-- Add payment_reference column to store Worldpay transaction reference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add payment_status to track payment state separately from order status
-- Values: 'pending', 'authorized', 'refused', 'error', 'cancelled'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Update order status enum to include awaiting_payment
-- Note: If using enum, you may need to add this value
-- ALTER TYPE order_status ADD VALUE 'awaiting_payment';

-- Index for faster lookup by payment_reference
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Comment for documentation
COMMENT ON COLUMN orders.payment_reference IS 'Worldpay transaction reference for payment tracking';
COMMENT ON COLUMN orders.payment_status IS 'Payment status from Worldpay: pending, authorized, refused, error, cancelled';
