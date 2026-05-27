# 仓库文件内容模型

Raincat Wiki 不依赖 Notion 或外部 CMS。所有公开内容都来自仓库文件。

## 站点配置

- `public/site/config.json`: 网站标题、昵称、头像、配色、社交链接、开关。
- `public/site/card-styles.json`: 首页卡片尺寸、显示状态、顺序和拖拽偏移。

设置面板保存时会同时提交这两个文件。

## 文章

- `public/blogs/index.json`: 文章列表索引，公开列表会过滤 `hidden: true` 的文章。
- `public/blogs/categories.json`: 分类列表。
- `public/blogs/<slug>/config.json`: 单篇文章标题、时间、摘要、标签、分类、封面、隐藏状态。
- `public/blogs/<slug>/index.md`: 单篇文章 Markdown 正文。
- `public/blogs/<slug>/images/*`: 单篇文章使用的图片。

文章详情页允许直接访问隐藏文章，只是不出现在公开列表里。

## 其他页面

- `public/projects/index.json`: 项目列表。
- `public/share/index.json`: 分享/收藏列表。
- `public/bloggers/index.json`: 朋友/友链列表。
- `public/photos/index.json`: 照片墙。
- `public/about/content.md`: 关于页面正文。

## 写作页保存逻辑

`/write/new` 发布时会创建新的 `public/blogs/<slug>` 目录，并更新 `public/blogs/index.json` 与 `categories.json`。

`/write/<slug>` 发布时会覆盖对应文章的 `config.json` 和 `index.md`，并更新索引。

GitHub App 凭据未配置时，写作页仍可编辑和预览，但不会提交仓库。
