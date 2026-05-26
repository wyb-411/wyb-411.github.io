# 从 GitHub 仓库导入到 Vercel

## 1. 准备仓库

仓库地址：`https://github.com/wyb-411/rain-wiki`

确保仓库里已经包含：

- `package.json`
- `src/app`
- `public/site/config.json`
- `public/blogs/index.json`

## 2. 导入 Vercel

1. 打开 Vercel Dashboard。
2. 点击 `Add New...` -> `Project`。
3. 选择 GitHub 仓库 `wyb-411/rain-wiki`。
4. Framework Preset 选择 `Next.js`。
5. Build Command 保持 `npm run build`。
6. Output Directory 不需要填写。
7. Install Command 保持 `npm install`。

## 3. 配置环境变量

在 Vercel 项目导入页或项目 `Settings` -> `Environment Variables` 添加：

```bash
NEXT_PUBLIC_GITHUB_OWNER=wyb-411
NEXT_PUBLIC_GITHUB_REPO=rain-wiki
NEXT_PUBLIC_GITHUB_BRANCH=main
NEXT_PUBLIC_GITHUB_APP_ID=你的 GitHub App ID
NEXT_PUBLIC_GITHUB_ENCRYPT_KEY=一段足够长的随机字符串
```

保存后重新部署一次。

## 4. 绑定域名

1. 进入 Vercel 项目 `Settings` -> `Domains`。
2. 添加 `raincatwiki.top`。
3. 按 Vercel 提示到域名服务商添加 DNS 记录。
4. 等待证书自动签发。

## 5. 发布内容

部署成功后：

1. 打开线上网站。
2. 右上角设置里导入 GitHub App `.pem`。
3. 修改设置或进入 `/write/new` 写文章。
4. 发布会提交仓库，Vercel 自动触发下一次部署。
