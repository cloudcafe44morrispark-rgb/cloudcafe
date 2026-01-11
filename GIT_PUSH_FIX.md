# 解决Git Push 403权限错误

## 问题诊断
错误信息：`Permission denied to gibroughtta-maker`

**问题原因**：
- Git正在使用错误的GitHub账户：`gibroughtta-maker`
- 仓库属于：`cloudcafe44morrispark-rgb`
- 需要切换到正确的GitHub账户

---

## 解决方案1: 清除Windows凭据管理器中的旧凭据（推荐）

### 步骤1: 打开凭据管理器
1. 按 `Win + R`
2. 输入：`control /name Microsoft.CredentialManager`
3. 按回车

### 步骤2: 删除GitHub凭据
1. 点击 **"Windows 凭据"**
2. 找到所有包含 `github.com` 的凭据
3. 点击每个凭据，选择 **"删除"**

### 步骤3: 重新Push
```bash
cd C:\Users\gibro\Documents\cloudcafe
git push
```

这次会弹出GitHub登录窗口，输入正确的账户信息：
- **Username**: cloudcafe44morrispark-rgb 账户的用户名
- **Password**: Personal Access Token (不是密码)

---

## 解决方案2: 使用命令行清除凭据

```bash
cd C:\Users\gibro\Documents\cloudcafe

# 清除存储的凭据
git credential-manager-core erase
# 按Ctrl+D 或输入以下内容后按两次回车：
# protocol=https
# host=github.com

# 然后重新push
git push
```

---

## 解决方案3: 使用Personal Access Token直接push

### 步骤1: 创建Personal Access Token
1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
3. 设置Token名称（如：CloudCafe Deploy）
4. 勾选权限：
   - ✅ **repo** (所有子选项)
5. 点击 **"Generate token"**
6. **复制token**（只显示一次，务必保存！）

### 步骤2: 使用Token push
```bash
cd C:\Users\gibro\Documents\cloudcafe

# 使用token直接push
git push https://<YOUR_TOKEN>@github.com/cloudcafe44morrispark-rgb/cloudcafe.git
```

将 `<YOUR_TOKEN>` 替换为刚才复制的token。

---

## 解决方案4: 使用GitHub Desktop（最简单）

如果您已安装GitHub Desktop：
1. 打开 **GitHub Desktop**
2. 点击 **File** → **Options** → **Accounts**
3. 移除当前账户
4. 使用正确的账户重新登录
5. 回到仓库，点击 **"Push origin"**

---

## 推荐步骤

**最快的方法（推荐）**：

1. 打开凭据管理器删除GitHub凭据
   ```
   Win + R → control /name Microsoft.CredentialManager
   ```

2. 重新push
   ```bash
   cd C:\Users\gibro\Documents\cloudcafe
   git push
   ```

3. 在弹出的登录窗口输入正确的账户和Personal Access Token

---

## 验证成功

Push成功后会看到类似输出：
```
Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Writing objects: 100% (6/6), 2.34 KiB | 2.34 MiB/s, done.
Total 6 (delta 4), reused 0 (delta 0)
To https://github.com/cloudcafe44morrispark-rgb/cloudcafe.git
   abc1234..def5678  main -> main
```

然后Vercel会自动部署，访问：https://vercel.com 查看部署进度。
