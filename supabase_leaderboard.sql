-- ==========================================
-- King of Coffee - Weekly Leaderboard System
-- ==========================================

-- 1. Create weekly_leaderboard table
CREATE TABLE IF NOT EXISTS weekly_leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week_start DATE NOT NULL,  -- Monday of the week (UTC)
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  rank INTEGER,  -- Calculated rank, updated by trigger
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_week_start ON weekly_leaderboard(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON weekly_leaderboard(week_start, points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_week ON weekly_leaderboard(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON weekly_leaderboard(week_start, rank);

-- Enable RLS
ALTER TABLE weekly_leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard (public rankings)
CREATE POLICY "Anyone can view leaderboard" ON weekly_leaderboard
  FOR SELECT USING (true);

-- Only system (authenticated users) can modify through functions
CREATE POLICY "System can modify leaderboard" ON weekly_leaderboard
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Get the Monday (week start) of a given timestamp (UTC)
CREATE OR REPLACE FUNCTION get_week_start(ts TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS DATE AS $$
BEGIN
  -- Calculate Monday of the week
  -- DOW: 0=Sunday, 1=Monday, 2=Tuesday, etc.
  -- We want Monday, so: date - (DOW - 1) days
  -- Special case: if DOW=0 (Sunday), we want -6 days
  RETURN (ts::DATE - CASE
    WHEN EXTRACT(DOW FROM ts) = 0 THEN 6
    ELSE EXTRACT(DOW FROM ts)::INTEGER - 1
  END);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- POINTS UPDATE FUNCTION
-- ==========================================

-- Update or insert user's weekly points
CREATE OR REPLACE FUNCTION update_weekly_points(
  p_user_id UUID,
  p_points_to_add INTEGER
)
RETURNS void AS $$
DECLARE
  v_week_start DATE := get_week_start();
BEGIN
  -- Insert or update user's weekly points
  INSERT INTO weekly_leaderboard (user_id, week_start, points)
  VALUES (p_user_id, v_week_start, p_points_to_add)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    points = weekly_leaderboard.points + p_points_to_add,
    updated_at = NOW();

  -- Recalculate ranks for current week (async, don't block)
  PERFORM refresh_weekly_ranks(v_week_start);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- RANKING CALCULATION
-- ==========================================

-- Refresh rankings for a specific week
CREATE OR REPLACE FUNCTION refresh_weekly_ranks(p_week_start DATE)
RETURNS void AS $$
BEGIN
  -- Update ranks using DENSE_RANK window function
  WITH ranked_users AS (
    SELECT
      id,
      DENSE_RANK() OVER (ORDER BY points DESC) as new_rank
    FROM weekly_leaderboard
    WHERE week_start = p_week_start
  )
  UPDATE weekly_leaderboard wl
  SET
    rank = ru.new_rank,
    updated_at = NOW()
  FROM ranked_users ru
  WHERE wl.id = ru.id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGER: Auto-update leaderboard from user_rewards
-- ==========================================

CREATE OR REPLACE FUNCTION auto_update_leaderboard_from_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_points_to_add INTEGER := 0;
BEGIN
  -- Calculate points based on changes to user_rewards

  -- Case 1: Stamps increased (user earned stamps)
  -- Each stamp = 1 point
  IF NEW.stamps > OLD.stamps THEN
    v_points_to_add := NEW.stamps - OLD.stamps;
  END IF;

  -- Case 2: Reward redeemed (pending_reward changed from true to false)
  -- Redeeming a reward = 1 point
  IF OLD.pending_reward = true AND NEW.pending_reward = false THEN
    v_points_to_add := v_points_to_add + 1;
  END IF;

  -- Case 3: Stamps reset due to reaching 10 (auto-convert to reward)
  -- The 10 stamps were already counted when they increased from 0-10
  -- So we don't add extra points here

  -- Update leaderboard if points were earned
  IF v_points_to_add > 0 THEN
    PERFORM update_weekly_points(NEW.user_id, v_points_to_add);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_rewards table
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON user_rewards;
CREATE TRIGGER trigger_update_leaderboard
  AFTER UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_leaderboard_from_rewards();

-- ==========================================
-- QUERY FUNCTIONS
-- ==========================================

-- Get top 5 users for current week
CREATE OR REPLACE FUNCTION get_top_5_this_week()
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  points INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wl.user_id,
    COALESCE(u.raw_user_meta_data->>'first_name', 'User') as first_name,
    COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
    wl.points,
    wl.rank
  FROM weekly_leaderboard wl
  JOIN auth.users u ON u.id = wl.user_id
  WHERE wl.week_start = get_week_start()
    AND wl.rank IS NOT NULL
  ORDER BY wl.rank ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's rank and points
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS TABLE (
  rank INTEGER,
  points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT wl.rank, wl.points
  FROM weekly_leaderboard wl
  WHERE wl.user_id = p_user_id
    AND wl.week_start = get_week_start();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE weekly_leaderboard IS 'Weekly coffee consumption leaderboard - King of Coffee';
COMMENT ON COLUMN weekly_leaderboard.week_start IS 'Monday date (UTC) of the week';
COMMENT ON COLUMN weekly_leaderboard.points IS 'Points earned this week (stamps + rewards redeemed)';
COMMENT ON COLUMN weekly_leaderboard.rank IS 'User rank for the week (DENSE_RANK)';

COMMENT ON FUNCTION get_week_start IS 'Returns Monday date of the week (UTC) for a given timestamp';
COMMENT ON FUNCTION update_weekly_points IS 'Add points to user for current week';
COMMENT ON FUNCTION refresh_weekly_ranks IS 'Recalculate all rankings for a specific week';
COMMENT ON FUNCTION auto_update_leaderboard_from_rewards IS 'Trigger function to auto-update leaderboard when user_rewards changes';
COMMENT ON FUNCTION get_top_5_this_week IS 'Get top 5 ranked users for current week with names';
COMMENT ON FUNCTION get_user_rank IS 'Get rank and points for a specific user in current week';

-- ==========================================
-- MIGRATION COMPLETE!
-- ==========================================
