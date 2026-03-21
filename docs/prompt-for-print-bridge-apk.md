# Prompt：让 Gemini 从零写「打印桥」Android APK

把下面整段复制给 Gemini（或其它 AI），请它生成一个**可直接用 Android Studio 打开并 Gradle 构建**的完整 Android 项目。

---

## 复制从这里开始 ↓

请用 **Kotlin + Android** 从零写一个「打印桥」应用，要求**能直接用 Android Studio 打开、Gradle 同步成功并构建出 APK**。不要引用现有仓库，请生成完整、可独立构建的项目结构（含 `settings.gradle.kts`、根目录与 app 的 `build.gradle.kts`、`AndroidManifest.xml`、一个 MainActivity、布局 XML、以及所有 Kotlin 源文件）。

### 功能目标

- 在**安卓平板/手机**上常驻运行，与**热敏打印机**（POS80GXA，80mm 纸）在同一 WiFi。
- 用 **Supabase** 作为后端：应用使用 **anon (public) key**，并以一个**专用 printer 用户**（邮箱+密码）登录；该用户在 Supabase 的 `user_metadata.role = 'printer'`，RLS 允许该角色：SELECT `orders`、`order_items`、`shop_config`，以及仅 UPDATE `orders.printed_at`。
- **逻辑**（用轮询即可，不必 Realtime）：
  1. 使用 anon key 创建 Supabase 客户端，`signInWithPassword(printer邮箱, printer密码)` 登录。
  2. 每 5 秒轮询一次：查询 `orders` 表中 `printed_at` 为 null 且 `created_at` 在过去 24 小时内的订单 ID。
  3. 对每个未打印订单：
     - 拉取该订单的 `orders` 一行（含 id, total, notes, created_at 等）；
     - 拉取 `order_items`（product_name, quantity, price），`order_id` 等于该订单 id；
     - 拉取 `shop_config` 中 `key = 'busy_mode'` 的 `value`：若为 true 则 `collectionMinutes = 55`，否则 `25`；
     - 计算取餐时间：`pickupTime = order.created_at + collectionMinutes`（分钟数）；
     - 将订单信息格式化成 **80mm 小票**（ESC/POS），通过 **TCP Socket** 发送到用户配置的**打印机 IP、端口 9100**；
     - 发送成功后，对该订单执行 UPDATE：`orders.printed_at = now()`（仅更新该字段）。
- **小票内容**：门店名 + "Order Receipt"、订单短 ID（如 id 前 8 位）、下单时间、取餐时间、商品行（数量 x 名称 + 行小计）、备注（若有）、总价。使用 **ESC/POS** 基础指令：初始化（ESC @）、文本行、换行、切纸（GS V 0）。编码可用 GBK 或 UTF-8，80mm 宽度约 48 字符。

### 应用内配置（必须可保存到本地）

- Supabase URL  
- Supabase anon key  
- Printer 用户邮箱  
- Printer 用户密码  
- 打印机 IP（端口固定 9100）  

保存后，应用用这些配置创建 Supabase 客户端并登录；打印时连接 `打印机IP:9100`。

### UI 要求

- 一个主界面（一个 Activity 即可）：  
  - 上述 5 个配置项各一个输入框（anon key 可遮罩），一个「保存配置」按钮（写入 SharedPreferences 或 DataStore）。  
  - 一个「测试打印」按钮：仅向当前配置的打印机 IP:9100 发送一张简单测试小票（如 "Test Receipt" + 切纸），不查数据库。  
  - 一个「开始监听」/「停止监听」按钮：开始后按上面逻辑轮询并打印，停止后取消轮询。  
  - 一个状态文本框：显示当前状态（未连接、已登录、正在打印 xxx、错误信息等）。  

### 技术约束

- **最小 SDK 26**，target/compile SDK 34；Kotlin 1.9+。  
- Supabase：使用官方或社区 **Kotlin 客户端**（如 supabase-kt），能 `createSupabaseClient(url, anonKey)`、`install(Auth)`、`install(Postgrest)`，并支持 `signInWithPassword`、`from("orders").select().filter(...)`、`from("orders").update(...)`。若某库的 API 与上述略有不同，请按该库当前文档写法生成，并保证依赖版本一致、能通过 Gradle 同步。  
- 网络与 IO：在主线程外执行（协程或线程），打印和 Supabase 请求均在后台执行，状态通过 runOnUiThread 或 LiveData/StateFlow 更新到 UI。  
- 不需要 Realtime 订阅；仅轮询即可。  
- 项目必须包含：`gradle/wrapper/gradle-wrapper.properties` 与 `gradlew`/`gradlew.bat`，以便命令行也能执行 `./gradlew assembleDebug` 生成 APK。  

### 交付物

- 完整的 Android 项目目录结构（可从项目根逐文件列出或打包）。  
- 每个关键文件给出完整内容（Gradle、Manifest、Activity、布局、Supabase 登录与轮询逻辑、ESC/POS 生成与 TCP 发送、配置读写），确保复制后即可在 Android Studio 中打开并成功构建 APK。  

---

## 复制到这里结束 ↑
