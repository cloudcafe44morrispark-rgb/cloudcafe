-- ==========================================
-- King of Coffee - Data Migration Script
-- ==========================================
-- This script migrates existing user stamps to the weekly leaderboard
-- Run this AFTER running supabase_leaderboard.sql

-- Migrate existing stamps to current week's leaderboard
INSERT INTO weekly_leaderboard (user_id, week_start, points)
SELECT
  user_id,
  get_week_start() as week_start,
  stamps as points  -- Each stamp = 1 point
FROM user_rewards
WHERE stamps > 0
ON CONFLICT (user_id, week_start)
DO UPDATE SET
  points = EXCLUDED.points,
  updated_at = NOW();

-- Refresh ranks for current week
SELECT refresh_weekly_ranks(get_week_start());

-- Verify migration
SELECT
  COUNT(*) as total_users,
  SUM(points) as total_points
FROM weekly_leaderboard
WHERE week_start = get_week_start();
