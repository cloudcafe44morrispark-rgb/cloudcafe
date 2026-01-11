# 修复步骤指南

## 🔧 需要在Supabase中执行的操作

### 步骤1: 执行SQL脚本创建RPC函数

1. 打开 **Supabase Dashboard**
2. 进入 **SQL Editor**
3. 复制 `supabase_get_user_info.sql` 的内容
4. 点击 **Run** 执行

该脚本会：
- ✅ 创建 `get_user_info` RPC函数
- ✅ 重新创建所有管理员RLS策略
- ✅ 检查用户账号的role设置

---

### 步骤2: 验证管理员账号role设置

在SQL Editor中执行：

```sql
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email = 'Demouser2026@test.com';
```

**预期结果**：
- `role` 应该是 `'admin'`
- 如果 `role` 为 `null`，需要手动设置：

```sql
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'Demouser2026@test.com';
```

---

### 步骤3: 检查wendy账号信息

```sql
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email = 'wendybaby0424@gmail.com';
```

**预期结果**：
- 应该显示 `first_name` 为 "wendy" 或 "Wendy"
- 如果为空，需要更新：

```sql
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || '{"first_name": "Wendy"}'::jsonb
WHERE email = 'wendybaby0424@gmail.com';
```

---

## 📝 代码修改说明

已修改以下文件：

### 1. [supabase_get_user_info.sql](file:///c:/Users/gibro/Documents/cloudcafe/supabase_get_user_info.sql) (新建)
- 创建RPC函数获取用户信息
- 重新配置RLS权限

### 2. [src/app/lib/admin.ts](file:///c:/Users/gibro/Documents/cloudcafe/src/app/lib/admin.ts) (新建)
- 提供 `getUserInfo()` 辅助函数
- 提供 `isCurrentUserAdmin()` 验证函数

### 3. [src/app/components/AdminScanPage.tsx](file:///c:/Users/gibro/Documents/cloudcafe/src/app/components/AdminScanPage.tsx) (修改)
- 第98-159行：修改 `handleScan` 函数
- 调用 `get_user_info` RPC获取真实用户信息
- 显示真实的email和姓名

---

## 🧪 测试步骤

### 1. 测试本地开发环境

```bash
npm run dev
```

### 2. 测试流程

1. **以管理员身份登录**（Demouser2026@test.com）
2. **访问管理员扫描页面**：`/admin/scan`
3. **扫描wendy的QR码**（或输入wendy的user_id）
4. **验证显示**：
   - ✅ Name: Wendy (而不是Customer)
   - ✅ Email: wendybaby0424@gmail.com (而不是User ID: xxx)
   - ✅ Stamps: 7
   - ✅ Pending Reward: 0

5. **点击 "Add 1 Stamp"**
   - ✅ Stamps应该增加到8
   - ✅ 显示成功提示

---

## ⚠️ 常见问题排查

### 问题1: RPC函数调用失败
**错误**: `Failed to get user info: permission denied`

**解决**：
1. 确认管理员账号的 `user_metadata.role = 'admin'`
2. 重新登录刷新JWT token
3. 检查RPC函数的GRANT权限

### 问题2: 仍然无法添加积分
**错误**: `Failed to add stamp: permission denied`

**解决**：
1. 检查RLS策略是否正确创建
2. 确认没有其他冲突的策略
3. 查看Supabase日志获取详细错误

### 问题3: 显示"Customer"而非真实姓名
**可能原因**：
- wendy账号的 `raw_user_meta_data` 中没有 `first_name`
- RPC函数返回null

**解决**：
执行SQL更新wendy的metadata：
```sql
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || '{"first_name": "Wendy", "last_name": "Baby"}'::jsonb
WHERE email = 'wendybaby0424@gmail.com';
```

---

## ✅ 完成检查清单

- [ ] 在Supabase执行 `supabase_get_user_info.sql`
- [ ] 验证管理员账号role为'admin'
- [ ] 验证wendy账号有first_name
- [ ] 本地运行 `npm run dev`
- [ ] 测试扫描显示正确用户信息
- [ ] 测试成功添加积分
- [ ] 测试积分达到10时转为奖励
