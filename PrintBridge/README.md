# PrintBridge (Android)

用安卓设备连接 Supabase 与热敏打印机（80mm ESC/POS，TCP）。使用专用 **printer** 用户（RLS），每 5 秒轮询未打印订单，打印后更新 `orders.printed_at`。

## 你现在没有项目也没关系

**这个文件夹就是一个完整的 Android 项目**，不需要先建空项目。

### 怎么打开并构建

1. 安装 **Android Studio**（若未安装）：https://developer.android.com/studio  
2. 打开 Android Studio → **File → Open**（或欢迎页的 **Open**）。  
3. 选中 **`PrintBridge`** 这个文件夹（在 cloudcafe 仓库里的 `PrintBridge` 目录），点 **OK**。  
4. 等待右下角 **Gradle Sync** 完成（首次会下载依赖，可能几分钟）。  
5. 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**。  
6. 构建完成后，APK 在 `app/build/outputs/apk/debug/app-debug.apk`，可拷到手机/平板安装。

若打开后提示「缺少 Gradle Wrapper」或无法同步，在 Android Studio 里选 **File → Sync Project with Gradle Files**，或按提示选择 **Create wrapper** / **Use default gradle wrapper** 即可。

## 前置条件（Supabase）

- 在 Supabase 里执行过根目录的 **`supabase_print_bridge.sql`**。  
- 已创建一个用户，并在 SQL 里给该用户设 `user_metadata.role = 'printer'`（见 `docs/print-bridge-setup.md`）。

## 应用内配置

- **Supabase URL**：项目 URL（Settings → API）  
- **Anon Key**：anon/public key  
- **Printer email / password**：printer 用户的邮箱和密码  
- **Printer IP**：热敏打印机局域网 IP（端口固定 9100）  

保存 → 点 **Test print** 测打印机 → 点 **Start listening** 开始轮询并自动打印。

## 技术栈

- Kotlin、XML 布局、Supabase KT 2.1.0（BOM）、Ktor Android、Kotlinx Serialization、协程  
- Java Socket 连打印机（ESC/POS）
