-- ==========================================
-- 重新填充本周排行榜数据
-- ==========================================
-- 在 Supabase SQL Editor 中运行这段代码

-- 从现有的 user_rewards 数据重新填充排行榜
DO $$
DECLARE
  r RECORD;
  v_week_start DATE;
BEGIN
  -- 获取本周的开始日期
  v_week_start := (SELECT get_week_start());

  -- 遍历所有有积分的用户
  FOR r IN
    SELECT user_id, stamps, pending_reward
    FROM user_rewards
    WHERE stamps > 0 OR pending_reward = true
  LOOP
    -- 根据stamps添加积分
    IF r.stamps > 0 THEN
      PERFORM update_weekly_points(r.user_id, r.stamps);
    END IF;

    -- 如果有待兑换的奖励，额外加1分
    IF r.pending_reward = true THEN
      PERFORM update_weekly_points(r.user_id, 1);
    END IF;
  END LOOP;

  -- 刷新排名
  PERFORM refresh_weekly_ranks(v_week_start);

  -- 显示结果
  RAISE NOTICE '排行榜已更新！本周开始日期: %', v_week_start;
END $$;

-- 查看更新后的排行榜
SELECT
  wl.rank,
  wl.points,
  u.raw_user_meta_data->>'first_name' as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  u.email
FROM weekly_leaderboard wl
JOIN auth.users u ON u.id = wl.user_id
WHERE wl.week_start = (SELECT get_week_start())
ORDER BY wl.rank
LIMIT 10;

-- 测试查询函数
SELECT * FROM get_top_5_this_week();
