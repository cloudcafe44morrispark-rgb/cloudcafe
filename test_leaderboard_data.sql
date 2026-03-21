-- ==========================================
-- Test Data for King of Coffee Leaderboard
-- ==========================================
-- Run this in your Supabase SQL Editor to populate test data

-- First, check if the weekly_leaderboard table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'weekly_leaderboard'
);

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('get_top_5_this_week', 'get_user_rank', 'update_weekly_points');

-- View current leaderboard data
SELECT * FROM weekly_leaderboard ORDER BY points DESC;

-- View user_rewards to see who has activity
SELECT
  ur.user_id,
  ur.stamps,
  ur.pending_reward,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.email
FROM user_rewards ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.stamps DESC;

-- ==========================================
-- OPTION 1: Manually insert test data
-- ==========================================
-- Replace the UUIDs below with actual user IDs from your database

-- First get some user IDs
-- SELECT id, email, raw_user_meta_data->>'first_name' as name FROM auth.users LIMIT 5;

-- Then insert test data (uncomment and replace UUIDs):
/*
DO $$
DECLARE
  v_week_start DATE := (SELECT get_week_start());
BEGIN
  -- Insert test leaderboard entries
  INSERT INTO weekly_leaderboard (user_id, week_start, points, rank)
  VALUES
    ('YOUR-USER-ID-1', v_week_start, 25, 1),
    ('YOUR-USER-ID-2', v_week_start, 20, 2),
    ('YOUR-USER-ID-3', v_week_start, 15, 3),
    ('YOUR-USER-ID-4', v_week_start, 10, 4),
    ('YOUR-USER-ID-5', v_week_start, 5, 5)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    points = EXCLUDED.points,
    rank = EXCLUDED.rank;
END $$;
*/

-- ==========================================
-- OPTION 2: Trigger the leaderboard from existing user_rewards
-- ==========================================
-- This will update leaderboard based on current stamps

-- Force update leaderboard for all users with stamps
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id, stamps, pending_reward
    FROM user_rewards
    WHERE stamps > 0 OR pending_reward = true
  LOOP
    -- Add points based on stamps
    IF r.stamps > 0 THEN
      PERFORM update_weekly_points(r.user_id, r.stamps);
    END IF;

    -- Add point for pending reward
    IF r.pending_reward = true THEN
      PERFORM update_weekly_points(r.user_id, 1);
    END IF;
  END LOOP;

  -- Refresh ranks
  PERFORM refresh_weekly_ranks((SELECT get_week_start()));
END $$;

-- View updated leaderboard
SELECT
  wl.*,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.email
FROM weekly_leaderboard wl
JOIN auth.users u ON u.id = wl.user_id
WHERE wl.week_start = (SELECT get_week_start())
ORDER BY wl.rank;

-- Test the query functions
SELECT * FROM get_top_5_this_week();

-- Test getting a specific user's rank (replace with actual user ID)
-- SELECT * FROM get_user_rank('YOUR-USER-ID');
