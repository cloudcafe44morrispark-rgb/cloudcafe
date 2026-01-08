-- ==========================================
-- Loyalty Rewards System - Database Schema
-- ==========================================

-- 1. Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  stamps INTEGER DEFAULT 0 CHECK (stamps >= 0 AND stamps < 10),
  pending_reward BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);

-- Enable RLS
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards" ON user_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own rewards
CREATE POLICY "Users can update own rewards" ON user_rewards
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own rewards record
CREATE POLICY "Users can insert own rewards" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all rewards
CREATE POLICY "Admins can view all rewards" ON user_rewards
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('demouser2026@test.com', 'admin@cloudcafe.com')
  );

-- 2. Create reward_transactions table
CREATE TABLE IF NOT EXISTS reward_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stamp_earned', 'stamp_scan', 'reward_earned', 'reward_redeemed')),
  amount INTEGER NOT NULL,
  admin_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON reward_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON reward_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON reward_transactions
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('demouser2026@test.com', 'admin@cloudcafe.com')
  );

-- System can insert transactions (authenticated users)
CREATE POLICY "System can insert transactions" ON reward_transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Create helper function for auto-converting stamps to rewards
CREATE OR REPLACE FUNCTION auto_convert_stamps_to_rewards()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stamps >= 10 THEN
    -- Convert stamps to reward
    NEW.pending_reward := TRUE;
    NEW.stamps := 0;
    NEW.updated_at := NOW();
    
    -- Log the conversion
    INSERT INTO reward_transactions (user_id, type, amount)
    VALUES (NEW.user_id, 'reward_earned', 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_convert_stamps ON user_rewards;
CREATE TRIGGER trigger_auto_convert_stamps
  BEFORE UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION auto_convert_stamps_to_rewards();

-- 4. Add comments for documentation
COMMENT ON TABLE user_rewards IS 'Stores user loyalty stamps and rewards';
COMMENT ON COLUMN user_rewards.stamps IS 'Stamps earned (0-9), auto-converts to reward at 10';
COMMENT ON COLUMN user_rewards.pending_reward IS 'Whether user has a pending reward to redeem';

COMMENT ON TABLE reward_transactions IS 'History of all stamp/reward transactions';
COMMENT ON COLUMN reward_transactions.type IS 'Transaction type: stamp_earned, stamp_scan, reward_earned, reward_redeemed';

-- ==========================================
-- Migration Complete!
-- ==========================================
