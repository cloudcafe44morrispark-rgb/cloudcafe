-- ==========================================
-- Admin Helper: Get User Info Function
-- 在Supabase SQL Editor中执行此脚本
-- ==========================================

-- 1. 创建函数获取用户信息（仅管理员可调用）
CREATE OR REPLACE FUNCTION get_user_info(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- 检查调用者是否是管理员
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    au.raw_user_meta_data->>'role' as role
  FROM auth.users au
  WHERE au.id = user_id;
END;
$$;

-- 2. 授权给authenticated用户调用
GRANT EXECUTE ON FUNCTION get_user_info(UUID) TO authenticated;

-- ==========================================
-- 验证和测试SQL
-- ==========================================

-- 检查管理员账号的role设置
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'first_name' as first_name
FROM auth.users
WHERE email IN ('Demouser2026@test.com', 'wendybaby0424@gmail.com');

-- 检查user_rewards表的RLS策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_rewards'
ORDER BY policyname;

-- 测试RPC函数（需要以管理员身份登录后在客户端测试）
-- SELECT * FROM get_user_info('wendy的user_id');

-- ==========================================
-- 如果RLS策略缺失，执行以下SQL创建
-- ==========================================

-- 删除可能冲突的旧策略
DROP POLICY IF EXISTS "Admins can insert rewards for users" ON user_rewards;
DROP POLICY IF EXISTS "Admins can update any user rewards" ON user_rewards;
DROP POLICY IF EXISTS "Admins can view all rewards" ON user_rewards;

-- 重新创建管理员RLS策略
CREATE POLICY "Admins can insert rewards for users" ON user_rewards
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update any user rewards" ON user_rewards
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can view all rewards" ON user_rewards
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR auth.uid() = user_id
  );

-- ==========================================
-- 完成！
-- ==========================================

COMMENT ON FUNCTION get_user_info(UUID) IS 'Get user information for admin. Returns email, first_name, last_name, role.';
