# 🚨 扫描失败：Failed to Get User Info

## 问题诊断

扫描时提示 "Failed to get user info"，说明RPC函数 `get_user_info` 调用失败。

## 可能的原因

### 原因1: 管理员权限检查失败 ⚠️ **最可能**

RPC函数中有这个检查：
```sql
IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'admin' THEN
  RAISE EXCEPTION 'Access denied: admin only';
END IF;
```

**问题**：即使数据库中 `raw_user_meta_data->>'role' = 'admin'`，登录时的JWT token中可能没有包含这个信息，或者路径不对。

### 原因2: 需要重新登录刷新JWT token

设置role后，旧的JWT token不包含新的metadata，需要重新登录。

---

## 🔧 解决方案

### 方案1: 使用修复版RPC函数（推荐）

我已经创建了 `supabase_get_user_info_fixed.sql`，它**暂时移除了管理员权限检查**。

#### 在Supabase SQL Editor执行：

```sql
-- 删除旧函数
DROP FUNCTION IF EXISTS get_user_info(UUID);

-- 创建新版本：移除管理员权限检查
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
  -- 允许所有认证用户调用
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

GRANT EXECUTE ON FUNCTION get_user_info(UUID) TO authenticated;
```

执行后，**不需要重新部署代码**，直接在手机上重试扫描即可。

---

### 方案2: 重新登出登录（如果方案1不起作用）

1. 在手机上登出管理员账号
2. 清除浏览器缓存
3. 重新登录 demouser2026@test.com
4. 再次尝试扫描

---

## 📝 测试步骤

### 1. 执行修复SQL
将 `supabase_get_user_info_fixed.sql` 的内容复制到Supabase SQL Editor执行

### 2. 测试RPC函数
在SQL Editor执行：
```sql
SELECT * FROM get_user_info('1c887966-10aa-47c9-8b35-b37e8febb00d');
```

应该返回wendy的信息。

### 3. 手机上重试扫描
不需要重新部署，直接刷新页面后扫描wendy的QR码。

---

## 预期结果

✅ 扫描成功，显示：
- Name: **Wendy Q**
- Email: **wendybaby0424@gmail.com**
- Stamps: **7**

---

## 如果还是失败

请拍截图发给我，包括：
1. 手机上显示的错误信息
2. 浏览器控制台的错误（如果能访问）

我会进一步调试！
