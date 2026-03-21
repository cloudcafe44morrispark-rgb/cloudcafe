-- ==========================================
-- 检查和修复排行榜
-- ==========================================

-- 第1步：检查本周的开始日期
SELECT get_week_start() as this_week_start;

-- 第2步：查看weekly_leaderboard表中的所有数据
SELECT
  week_start,
  COUNT(*) as user_count,
  MAX(points) as max_points
FROM weekly_leaderboard
GROUP BY week_start
ORDER BY week_start DESC;

-- 第3步：查看本周的排行榜数据
SELECT
  wl.*,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name
FROM weekly_leaderboard wl
LEFT JOIN auth.users u ON u.id = wl.user_id
WHERE wl.week_start = (SELECT get_week_start())
ORDER BY wl.points DESC;

-- 第4步：查看user_rewards中有活动的用户
SELECT
  ur.user_id,
  ur.stamps,
  ur.pending_reward,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.email
FROM user_rewards ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.stamps > 0 OR ur.pending_reward = true
ORDER BY ur.stamps DESC;

-- 第5步：测试get_top_5_this_week函数
SELECT * FROM get_top_5_this_week();

-- ==========================================
-- 如果上面显示没有数据，运行下面的代码来填充
-- ==========================================

-- 清空本周数据重新开始
DELETE FROM weekly_leaderboard WHERE week_start = (SELECT get_week_start());

-- 从user_rewards重新填充
DO $$
DECLARE
  r RECORD;
  v_week_start DATE;
BEGIN
  v_week_start := (SELECT get_week_start());

  -- 为每个有stamps的用户添加积分
  FOR r IN
    SELECT user_id, stamps, pending_reward
    FROM user_rewards
    WHERE stamps > 0 OR pending_reward = true
  LOOP
    -- 计算总积分
    DECLARE
      total_points INTEGER := 0;
    BEGIN
      total_points := r.stamps;

      IF r.pending_reward THEN
        total_points := total_points + 1;
      END IF;

      -- 插入或更新
      INSERT INTO weekly_leaderboard (user_id, week_start, points)
      VALUES (r.user_id, v_week_start, total_points)
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET points = EXCLUDED.points;
    END;
  END LOOP;

  -- 刷新排名
  PERFORM refresh_weekly_ranks(v_week_start);

  RAISE NOTICE '完成！已更新 % 个用户的排行榜数据', (SELECT COUNT(*) FROM weekly_leaderboard WHERE week_start = v_week_start);
END $$;

-- 验证结果
SELECT
  wl.rank,
  wl.points,
  COALESCE(u.raw_user_meta_data->>'first_name', 'User') as first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name
FROM weekly_leaderboard wl
JOIN auth.users u ON u.id = wl.user_id
WHERE wl.week_start = (SELECT get_week_start())
ORDER BY wl.rank
LIMIT 10;

-- 再次测试函数
SELECT * FROM get_top_5_this_week();
