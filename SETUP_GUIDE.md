# Cloud Cafe 项目设置指南

## 在新电脑上运行项目

### 1. 克隆代码

```bash
git clone https://github.com/cloudcafe44morrispark-rgb/cloudcafe.git
cd cloudcafe
npm install
npm run dev
```

项目将在 http://localhost:5173 运行

---

## Supabase 配置

### 项目信息
- **Project URL**: `https://jsldrmudlqtwffwtrcwh.supabase.co`
- **API Key**: `sb_publishable_O9G8dw66xC4qAxPOpCN3MA_yz5Fe0-w`

### 创建数据库表

登录 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目 → **SQL Editor** → 执行以下 SQL：

```sql
CREATE TABLE user_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  stamps INTEGER DEFAULT 0 CHECK (stamps >= 0 AND stamps <= 10),
  pending_reward BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON user_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow updates" ON user_rewards
  FOR UPDATE USING (true);
```

### 配置邮箱验证重定向

**Authentication** → **URL Configuration** → 添加 Redirect URL：
- 开发环境: `http://localhost:5173/verified`
- 生产环境: `https://您的域名/verified`

---

## 页面路由

| 路径 | 描述 |
|------|------|
| `/` | 首页 |
| `/menu` | 菜单页面 |
| `/rewards` | 积分奖励页面（显示用户 QR 码） |
| `/cart` | 购物车 |
| `/signin` | 登录 |
| `/register` | 注册 |
| `/verified` | 邮箱验证成功页面 |
| `/staff` | 店员扫码页面（添加 stamp / 兑换奖励） |

---

## 积分系统说明

1. 用户登录后在 `/rewards` 页面显示专属 QR 码
2. 店员访问 `/staff` 页面输入用户 ID
3. 点击 "Add Stamp" 添加积分
4. 集满 10 个 stamp 后显示 "Reward Ready"
5. 点击 "Redeem" 兑换奖励，积分清零
6. 有待兑换奖励时不能继续添加 stamp
