-- ==========================================
-- 快速重新填充排行榜数据
-- ==========================================
-- 直接在Supabase SQL Editor中运行

-- 步骤1: 检查本周数据
SELECT
  'Current week start:' as info,
  get_week_start() as week_start;

SELECT
  'Existing leaderboard entries this week:' as info,
  COUNT(*) as count
FROM weekly_leaderboard
WHERE week_start = get_week_start();

SELECT
  'Users with stamps:' as info,
  COUNT(*) as count
FROM user_rewards
WHERE stamps > 0;

-- 步骤2: 从user_rewards重新填充本周排行榜
INSERT INTO weekly_leaderboard (user_id, week_start, points)
SELECT
  user_id,
  get_week_start() as week_start,
  stamps as points
FROM user_rewards
WHERE stamps > 0
ON CONFLICT (user_id, week_start)
DO UPDATE SET
  points = EXCLUDED.points,
  updated_at = NOW();

-- 步骤3: 刷新排名
SELECT refresh_weekly_ranks(get_week_start());

-- 步骤4: 验证结果
SELECT
  'Leaderboard after refresh:' as info,
  wl.rank,
  wl.points,
  COALESCE(u.raw_user_meta_data->>'first_name', 'User') as first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name
FROM weekly_leaderboard wl
JOIN auth.users u ON u.id = wl.user_id
WHERE wl.week_start = get_week_start()
ORDER BY wl.rank;

-- 步骤5: 测试查询函数
SELECT
  'Testing get_top_5_this_week():' as info,
  *
FROM get_top_5_this_week();
