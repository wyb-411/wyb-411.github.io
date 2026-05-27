# GitHub App 创建与配置

Raincat Wiki 的站内设置和写作发布采用参考站同款仓库文件方案：站内导入 GitHub App `.pem` 私钥，前端临时换取 installation token，然后提交 `public` 目录里的 JSON / Markdown 文件。

## 1. 创建 GitHub App

1. 打开 GitHub: `Settings` -> `Developer settings` -> `GitHub Apps` -> `New GitHub App`。
2. 填写 App name，例如 `Raincat Wiki Publisher`。
3. Homepage URL 填你的站点地址或仓库地址。
4. Webhook 取消勾选 `Active`，本项目不需要 webhook。
5. Repository permissions:
   - `Contents`: `Read and write`
   - `Metadata`: `Read-only`
6. Where can this GitHub App be installed 选择 `Only on this account`。
7. 创建后进入 App 页面，记录 `App ID`。

## 2. 安装到仓库

1. 在 GitHub App 页面左侧点击 `Install App`。
2. 选择账号 `wyb-411`。
3. 仓库选择 `Only select repositories`，勾选 `rain-wiki`。
4. 完成安装。

## 3. 生成 `.pem` 私钥

1. 回到 GitHub App 页面。
2. 在 `Private keys` 区域点击 `Generate a private key`。
3. GitHub 会下载一个 `.pem` 文件。
4. 这个文件只在你本人需要站内发布时导入浏览器，不要提交到仓库。

## 4. 配置环境变量

本地 `.env.local` 和 Vercel 环境变量都需要：

```bash
NEXT_PUBLIC_GITHUB_OWNER=wyb-411
NEXT_PUBLIC_GITHUB_REPO=rain-wiki
NEXT_PUBLIC_GITHUB_BRANCH=main
NEXT_PUBLIC_GITHUB_APP_ID=你的 App ID
NEXT_PUBLIC_GITHUB_ENCRYPT_KEY=一段足够长的随机字符串
```

`NEXT_PUBLIC_GITHUB_APP_ID` 为空时，设置面板里的“保存到仓库”会保持禁用；写作页仍可进入，但不能发布。

## 5. 站内使用

1. 打开网站右上角设置按钮。
2. 进入 `发布` 标签。
3. 点击 `导入 .pem`。
4. 回到设置或写作页保存。

保存成功后，GitHub 仓库会出现一次提交；Vercel 检测到提交后自动部署。
