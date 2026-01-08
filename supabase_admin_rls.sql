-- ==========================================
-- Admin RLS Policies for Rewards System
-- Run this in Supabase SQL Editor
-- ==========================================

-- Allow admins to INSERT user_rewards for any user
CREATE POLICY "Admins can insert rewards for users" ON user_rewards
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow admins to UPDATE user_rewards for any user  
CREATE POLICY "Admins can update any user rewards" ON user_rewards
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow admins to SELECT all user_rewards (update existing policy)
DROP POLICY IF EXISTS "Admins can view all rewards" ON user_rewards;
CREATE POLICY "Admins can view all rewards" ON user_rewards
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow admins to INSERT reward_transactions
CREATE POLICY "Admins can insert transactions" ON reward_transactions
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ==========================================
-- Run this SQL in Supabase Dashboard:
-- 1. Go to SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- ==========================================
