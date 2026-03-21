# Print Bridge Setup (POS80GXA)

Android 打印桥接使用专用 Supabase 用户（角色 `printer`）订阅订单并更新 `printed_at`。按以下步骤配置。

---

## 在哪里操作、怎么操作（总览）

| 要做的事 | 在哪里操作 | 怎么操作 |
|----------|------------|----------|
| 数据库加字段、RLS 策略 | **Supabase 网页** | 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选你的项目 → 左侧 **SQL Editor** → 粘贴并运行 `supabase_print_bridge.sql` 里的内容。 |
| 创建 printer 用户、设 role | **Supabase 网页** | 同一 Dashboard → **Authentication** → **Users** → 新建用户；用 **SQL Editor** 执行文档里的 `update auth.users ...` 给该用户设 `role: printer`。 |
| 运行“打印桥”程序（订阅订单、发打印机） | **你自己的一台设备上** | 在和打印机**同一 WiFi** 的电脑或平板上运行一段程序（见下文「在哪里运行打印桥」）。程序里填：Supabase URL、anon key、printer 邮箱/密码、打印机 IP。 |

- **Supabase 相关**：全部在浏览器里打开 Supabase 项目 → SQL Editor / Authentication 里完成。
- **打印桥程序**：不在 Supabase 里跑，是在你本机或平板上的一个常驻进程/应用；它连 Supabase 收订单，再通过局域网连打印机发小票。

---

## 在哪里运行打印桥

- **电脑（和打印机同 WiFi）**：用 Node.js 写一个小脚本，在终端里 `node print-bridge.js` 常驻运行；脚本里用 3 节的代码（Supabase 登录、订阅、查订单、更新 `printed_at`），再自己实现 TCP 连打印机 IP:9100 发 ESC/POS。
- **Android 平板（常驻在前台）**：单独建一个 Android 项目，用 Supabase JS 或 Kotlin 客户端实现同样逻辑，平板和打印机同 WiFi，应用保持运行。

两种方式都要在**运行打印桥的那台设备**上配置：Supabase URL、anon key、printer 邮箱/密码、打印机 IP（端口一般 9100）。不要把这些写死在代码里，用环境变量或配置文件（如 `.env`）并在文档里说明不要提交到 Git。

---

## 在平板上怎么操作

前提：Supabase 迁移已跑、printer 用户已建好；平板和 POS80GXA 打印机在**同一 WiFi**。

### 第一步：准备好“打印桥”应用

- 仓库内已提供 **Android 打印桥源码**：`print-bridge-android/`。用 Android Studio 打开该目录，按其中 **README.md** 构建 APK（Build → Build APK(s)），得到 `app-debug.apk` 或 release 包。
- 应用逻辑：用 printer 账号登录 Supabase → 轮询未打印订单（`printed_at` 为空）→ 拉订单详情和 `shop_config` → 算取餐时间 → 通过 TCP 把 ESC/POS 发到打印机 IP:9100 → 更新 `printed_at`。代码逻辑亦可参考下文「3. 打印桥应用怎么做」。

### 第二步：在平板上安装并打开应用

- 若已有一个 APK：用数据线或网盘把 APK 传到平板，在平板上安装后打开。
- 若还在开发：用 USB 连接电脑与平板，在电脑上 Android Studio 里点 Run，选择该平板设备运行。

### 第三步：在应用里填写配置（通常有设置页或首次启动向导）

在**平板上的打印桥应用**里填（不要填到 Supabase 网页）：

| 配置项 | 填什么 | 从哪看 |
|--------|--------|--------|
| Supabase URL | 项目地址 | Supabase Dashboard → Settings → API → Project URL |
| Supabase anon key | 公钥 | 同上 → Project API keys → `anon` `public` |
| Printer 邮箱 | 你建的 printer 用户邮箱 | 创建用户时填的 |
| Printer 密码 | 该用户密码 | 创建用户时设的 |
| 打印机 IP | POS80GXA 的局域网 IP（如 192.168.1.100） | 打印机设置菜单或路由器设备列表 |
| 打印机端口 | 一般填 **9100** 不变 | 默认 9100 |

保存后应用会用 printer 账号登录并开始监听新订单。

### 第四步：保持应用常驻

- **不要关掉应用**：最小化可以，但不要从最近任务里划掉，否则可能收不到实时推送。
- 建议：平板设为**常亮**或较长熄屏时间，打印桥应用保持在前台或允许后台运行（视应用实现而定）。
- 若平板有“省电 / 后台限制”，请对打印桥应用**取消限制**，允许后台和自启动。

### 第五步：确认是否在工作

- 在 Cloud Cafe 前台下一笔测试订单。
- 若正常：平板上的打印桥会收到新单，打印机出小票，Supabase 里该订单的 `printed_at` 会有时间。
- 若没出小票：检查平板和打印机是否同一 WiFi、打印机 IP 是否填对、应用是否被系统杀掉、Supabase 里 printer 用户的 role 是否已设为 `printer`。

---

## 1. 运行数据库迁移

在 Supabase Dashboard → SQL Editor 中执行：

- 运行项目根目录下的 `supabase_print_bridge.sql`（添加 `orders.printed_at` 及 printer 角色的 RLS 策略）。

## 2. 创建 Printer 用户

1. 在 Supabase Dashboard → **Authentication** → **Users** 中点击 **Add user** → **Create new user**，填写邮箱和密码，创建用户。
2. 设置角色 `role: printer`（二选一）：

   **方式 A：界面设置（若可用）**  
   - 在用户列表中点击该用户进入详情。  
   - 点击 **Edit user**（或右上角 ⋮ → Edit）。  
   - 找到 **User Metadata** / **Raw User Meta Data**，填入：`{"role":"printer"}`，保存。  
   - 若界面里没有 User Metadata 或无法编辑用户名/邮箱，用下面的 SQL 方式。

   **方式 B：用 SQL 设置（推荐，界面不能改时用）**  
   - 在 **SQL Editor** 中执行（把 `<用户邮箱>` 换成该用户的 email）：
   ```sql
   update auth.users
   set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"printer"}'::jsonb
   where email = '<用户邮箱>';
   ```
   - 执行后该用户的 JWT 里会包含 `user_metadata.role = 'printer'`，RLS 即可识别。

3. 记录该用户的**登录邮箱和密码**，供打印桥应用使用。  
   - 说明：Supabase 里“用户名”即邮箱，创建后通常不能在界面里改；若需换邮箱，可新建用户再用上面 SQL 设置 role。

## 3. 打印桥应用怎么做（代码要点）

**原则：** 使用 Supabase **anon (public) key** 创建客户端，用 printer 账号登录；不要使用 service_role key。

### 3.1 初始化并登录

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 使用 printer 用户的邮箱和密码登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'printer用户的邮箱',
  password: 'printer用户的密码',
});
if (error) throw error;
// 登录成功后，后续请求会带上 JWT，RLS 会识别 role = 'printer'
```

### 3.2 订阅新订单（Realtime）

```javascript
const channel = supabase
  .channel('orders-print-bridge')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'orders' },
    async (payload) => {
      const newOrder = payload.new;
      await handleNewOrder(newOrder.id);
    }
  )
  .subscribe();
```

### 3.3 收到新订单后：查详情 + 取餐时间 + 打印 + 标记已打印

```javascript
async function handleNewOrder(orderId) {
  // 1) 拉取订单详情和 order_items
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (orderErr || !order) return;

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, price')
    .eq('order_id', orderId);

  // 2) 取 shop_config 算取餐分钟数（与前端一致：busy_mode 为 true 则 55 分钟，否则 25 分钟）
  const { data: busyRow } = await supabase
    .from('shop_config')
    .select('value')
    .eq('key', 'busy_mode')
    .maybeSingle();
  const busyMode = busyRow?.value === true || busyRow?.value === 'true';
  const collectionMinutes = busyMode ? 55 : 25;

  // 3) 计算取餐时间（created_at + collectionMinutes）
  const createdAt = new Date(order.created_at);
  const pickupAt = new Date(createdAt.getTime() + collectionMinutes * 60 * 1000);

  // 4) 这里：把 order、items、pickupAt 格式化成 80mm 小票，通过 TCP 发到打印机 IP:9100
  // await sendToPrinter(receiptPayload);

  // 5) 打印成功后，只更新 printed_at（printer 角色仅允许更新该字段）
  await supabase.from('orders').update({ printed_at: new Date().toISOString() }).eq('id', orderId);
}
```

### 3.4 启动时补打漏单（过去 24 小时未打印的）

```javascript
const { data: pending } = await supabase
  .from('orders')
  .select('id')
  .is('printed_at', null)
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
for (const row of pending || []) await handleNewOrder(row.id);
```

- 使用 **anon key** + **printer 登录** 后，即可订阅 `orders`、查询 `orders`/`order_items`/`shop_config`、并只更新 `orders.printed_at`。
- 小票格式与 TCP 发送到 POS80GXA 的逻辑需在打印桥应用内自行实现（ESC/POS 指令、打印机 IP/端口等）。

## 4. shop_config 读取

- `shop_config` 表已配置为所有人可读（RLS: select using true），printer 用户无需额外策略即可读取 `busy_mode` 以计算 collection minutes。
