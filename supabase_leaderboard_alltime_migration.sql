-- ==========================================
-- King of Coffee - All-Time Leaderboard Migration
-- Changes weekly leaderboard to cumulative all-time points
-- ==========================================

-- Get top 5 users for all time (sum across all weeks)
CREATE OR REPLACE FUNCTION get_top_5_all_time()
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  points BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wl.user_id,
    COALESCE(u.raw_user_meta_data->>'first_name', 'User') as first_name,
    COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
    SUM(wl.points) as points,
    DENSE_RANK() OVER (ORDER BY SUM(wl.points) DESC) as rank
  FROM weekly_leaderboard wl
  JOIN auth.users u ON u.id = wl.user_id
  GROUP BY wl.user_id, u.raw_user_meta_data
  ORDER BY points DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's all-time rank and points
CREATE OR REPLACE FUNCTION get_user_rank_all_time(p_user_id UUID)
RETURNS TABLE (
  rank BIGINT,
  points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH all_totals AS (
    SELECT
      user_id,
      SUM(wl.points) as total_points,
      DENSE_RANK() OVER (ORDER BY SUM(wl.points) DESC) as user_rank
    FROM weekly_leaderboard wl
    GROUP BY user_id
  )
  SELECT at.user_rank, at.total_points
  FROM all_totals at
  WHERE at.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
