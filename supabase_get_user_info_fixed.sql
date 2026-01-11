-- ==========================================
-- 修复版本：Get User Info Function
-- 移除管理员检查，允许authenticated用户查询
-- ==========================================

-- 删除旧函数
DROP FUNCTION IF EXISTS get_user_info(UUID);

-- 创建新版本：修复类型不匹配问题
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
  -- 使用类型转换确保返回类型匹配
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,  -- 显式转换为TEXT
    (au.raw_user_meta_data->>'first_name')::TEXT,
    (au.raw_user_meta_data->>'last_name')::TEXT,
    (au.raw_user_meta_data->>'role')::TEXT
  FROM auth.users au
  WHERE au.id = user_id;
END;
$$;

-- 授权给authenticated用户调用
GRANT EXECUTE ON FUNCTION get_user_info(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_info(UUID) IS 'Get user information. Returns email, first_name, last_name, role. Permission check removed for debugging.';

-- ==========================================
-- 测试SQL
-- ==========================================

-- 测试获取wendy的信息
SELECT * FROM get_user_info('1c887966-10aa-47c9-8b35-b37e8febb00d');

-- ==========================================
-- 注意事项
-- ==========================================
-- 此版本移除了管理员权限检查
-- 功能测试成功后，可以考虑重新添加权限检查
-- 或者在应用层（TypeScript）进行权限验证
