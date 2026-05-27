# Raincat-wiki 产品需求文档 (PRD)

## 2026-05-25 实施修订

- **内容来源修订**: 本项目不再使用 Notion API 作为内容源；当前实现统一参考 https://lvyovo-wiki.tech/ 的仓库文件方案，站点内容以 `public/**/*.json` 与 `public/blogs/**/index.md` 为准。
- **管理权限修订**: 管理员通过 GitHub App `.pem` 私钥在站内获得发布权限；站内保存会提交 GitHub 仓库文件，随后由 Vercel 自动重新部署。
- **设置入口修订**: 不创建 `/settings` 路由；设置采用参考站同款“右上角按钮打开弹窗设置面板”。GitHub App App ID 或 `.pem` 未配置前，保存按钮保持禁用。
- **写作流程修订**: 首页写作卡与文章列表入口进入 `/write/new` 独立写作页；已有文章进入 `/write/[slug]`。无密钥时允许进入写作页，但发布按钮显示/引导“导入密钥”。
- **资源存储修订**: 头像、favicon、首页图片、照片墙图片、文章图片都存放在仓库 `public` 目录，不使用外部 CMS 或 Vercel Blob。
- **设计修订**: 当前实现以参考站的清新治愈毛玻璃卡片、动态英文问候、仓库文件内容管理、右上角设置弹窗和站内写作页为最高优先级。

## 项目概述

### 基本信息
- **项目名称**: Raincat-wiki (雨猫)
- **域名**: raincatwiki.top
- **项目类型**: 个人博客网站
- **主要语言**: 中文
- **内容来源**: Notion API

### 项目目标
打造一个以仪表盘为核心入口的个人博客网站，通过毛玻璃卡片展示各种功能模块，实现美观的视觉效果和良好的用户体验。

---

## 用户画像

### 主要用户
- **博主本人**: 通过导入密钥获得管理员权限，管理网站内容和设置
- **普通访客**: 只能浏览网站内容，无修改权限

---

## UI 设计规范 (Design System)

### 设计参考
- **主要参考**: https://lvyovo-wiki.tech/
- **设计风格**: 清新治愈系 + 毛玻璃 (Glassmorphism)
- **整体感觉**: 轻盈、柔和、可爱、有温度

### 1. 背景设计

#### 渐变背景
- **颜色来源**: 通过设置面板的"色彩配置"动态配置
  - 用户在"背景颜色"区域选择预设配色方案或自定义颜色
  - 预设方案如：春暖 (绿/黄系)、秋实 (红/橙系)、深夜 (蓝/紫系) 等
  - 用户可添加自定义配色组合
- **渐变角度**: 135deg (左上到右下)
- **渐变类型**: 线性渐变 (linear-gradient)
- **过渡方式**: 柔和平滑过渡，相邻色之间自然融合
- **实现原理**:
  ```css
  /* 示例：使用配置的颜色变量 */
  .page-background {
    background: linear-gradient(
      135deg,
      var(--bg-color-1) 0%,
      var(--bg-color-2) 25%,
      var(--bg-color-3) 50%,
      var(--bg-color-4) 75%,
      var(--bg-color-5) 100%
    );
    /* 多色渐变，营造丰富层次感 */
  }
  ```
- **动态切换**: 用户切换配色方案时，背景渐变通过 CSS transition 平滑过渡
  ```css
  .page-background {
    transition: background 0.5s ease-in-out;
  }
  ```

#### 背景纹理
- 可添加极淡的噪点纹理 (noise overlay)，增加质感
- 透明度极低 (opacity: 0.02-0.03)，不影响整体视觉

### 2. 毛玻璃卡片 (Glassmorphism)

#### 核心样式
```css
.glass-card {
  background: rgba(255, 255, 255, 0.65);  /* 半透明白色 */
  backdrop-filter: blur(16px);            /* 模糊背景 */
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);  /* 半透明边框 */
  border-radius: 20px;                    /* 大圆角 */
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.04),     /* 极淡阴影 */
    0 1px 3px rgba(0, 0, 0, 0.02);      /* 轻微投影 */
}
```

#### 层级变化
| 层级 | 透明度 | 模糊度 | 阴影 |
|------|--------|--------|------|
| 普通卡片 | 0.65 | 16px | 极淡 |
| Hover状态 | 0.75 | 16px | 加深 |
| 选中/激活 | 0.8 | 20px | 最明显 |
| 设置面板 | 0.85 | 24px | 较深 |

### 3. 圆角设计

| 元素 | 圆角大小 | 说明 |
|------|---------|------|
| 大卡片 | 20px-24px | 仪表盘主卡片、内容卡片 |
| 小卡片 | 16px | 导航按钮、小控件 |
| 按钮 | 12px-16px | 操作按钮、CTA |
| 输入框 | 12px | 表单输入 |
| 图片/头像 | 16px-50% | 方形图16px，圆形头像50% |
| 标签/徽章 | 8px | 小标签 |

### 4. 色彩系统

#### 主色调
| 颜色 | 色值 | 用途 |
|------|------|------|
| 主题色 | #4ECDC4 (薄荷绿) | 主按钮、高亮、链接 |
| 次级主题色 | #45B7D1 (天蓝) | 次要按钮、图标 |
| 强调色 | #FFE66D (淡黄) | 警告、高亮标记 |
| 文字主色 | #2C3E50 (深灰蓝) | 正文、标题 |
| 文字次色 | #7F8C8D (灰色) | 辅助文字、日期 |
| 文字淡色 | #BDC3C7 (浅灰) | 占位符、禁用状态 |

#### 功能色
| 用途 | 色值 |
|------|------|
| 成功 | #27AE60 |
| 警告 | #F39C12 |
| 错误 | #E74C3C |
| 信息 | #3498DB |

#### 背景色
| 用途 | 色值 |
|------|------|
| 页面背景 | linear-gradient(135deg, 配置颜色变量) |
| 卡片背景 | rgba(255, 255, 255, 0.65) |
| 输入框背景 | rgba(255, 255, 255, 0.8) |
| 遮罩层 | rgba(0, 0, 0, 0.3) + blur |

### 5. 字体系统

#### 字体选择
```css
font-family: 
  -apple-system, BlinkMacSystemFont,     /* 系统字体优先 */
  'Segoe UI', 'PingFang SC',             /* 中文优化 */
  'Hiragino Sans GB', 'Microsoft YaHei',
  'Helvetica Neue', Helvetica, Arial,
  sans-serif;
```

#### 字号规范
| 用途 | 字号 | 字重 | 行高 |
|------|------|------|------|
| 大标题 (H1) | 32px-40px | 700 | 1.2 |
| 中标题 (H2) | 24px-28px | 600 | 1.3 |
| 小标题 (H3) | 20px | 600 | 1.4 |
| 正文 | 16px | 400 | 1.6 |
| 辅助文字 | 14px | 400 | 1.5 |
| 小字/日期 | 12px | 400 | 1.4 |
| 卡片标题 | 18px | 600 | 1.4 |

### 6. 间距系统

#### 基础单位: 4px
| Token | 值 | 用途 |
|-------|-----|------|
| xs | 4px | 极小间距 |
| sm | 8px | 小组件内间距 |
| md | 16px | 组件内标准间距 |
| lg | 24px | 组件间间距 |
| xl | 32px | 区块间距 |
| 2xl | 48px | 大区块间距 |
| 3xl | 64px | 页面级间距 |

### 7. 图标风格

- **图标库**: Lucide React (线性图标)
- **图标大小**: 20px-24px (导航栏), 16px (小图标)
- **线条粗细**: 1.5px-2px
- **颜色**: 跟随文字颜色，hover时变为主题色
- **风格**: 简洁线性，无填充，圆角端点

### 8. 按钮样式

#### 主要按钮 (Primary)
```css
.btn-primary {
  background: #4ECDC4;
  color: white;
  padding: 10px 24px;
  border-radius: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}
```

#### 次要按钮 (Secondary)
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #2C3E50;
  padding: 10px 24px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
```

#### 图标按钮 (Icon Button)
```css
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
}
```

### 9. 导航栏设计

#### 样式
- **形状**: 胶囊形 (pill-shaped)
- **背景**: 半透明白色 + 毛玻璃效果
- **高度**: 56px-64px
- **位置**: 顶部固定，内容区域上方
- **对齐**: 居中或靠左
- **图标**: 仅图标，无文字，选中态有背景色块

#### 胶囊导航
```css
.navbar-capsule {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  border-radius: 28px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
```

### 10. 动画规范

#### 缓动函数
| 场景 | 缓动 | 时长 |
|------|------|------|
| 入场 | ease-out | 0.5-0.8s |
| 交互动画 | ease-in-out | 0.2-0.3s |
| 页面切换 | ease-in-out | 0.3-0.4s |
| 拖拽 | 无 (跟随鼠标) | - |

#### 常用动画
| 动画 | 参数 |
|------|------|
| 淡入 | opacity: 0 → 1, translateY: 20px → 0 |
| 缩放 | scale: 0.95 → 1 |
| 悬停放大 | scale: 1 → 1.02-1.05 |
| 点击反馈 | scale: 1 → 0.97 → 1 |
| 卡片飘落 | translateY: -100vh → randomY, rotate: random |

### 11. 响应式断点

| 断点 | 宽度 | 布局 |
|------|------|------|
| 手机 | < 640px | 单列，导航栏缩小 |
| 小平板 | 640-768px | 单列，卡片宽度自适应 |
| 平板 | 768-1024px | 2列网格 |
| 桌面 | 1024-1280px | 自由流式布局 |
| 大桌面 | > 1280px | 居中最大宽度1400px |

### 12. 特殊组件样式

#### 标签/徽章
```css
.tag {
  background: rgba(78, 205, 196, 0.15);
  color: #4ECDC4;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}
```

#### 分割线
```css
.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 16px 0;
}
```

#### 引用块
```css
.blockquote {
  border-left: 3px solid #4ECDC4;
  background: rgba(78, 205, 196, 0.08);
  padding: 12px 16px;
  border-radius: 0 12px 12px 0;
  color: #7F8C8D;
}
```

#### 便利贴 (照片墙)
```css
.sticky-note {
  background: #FFE66D;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: rotate(-2deg);
}
```

### 设计原则总结

1. **轻盈感**: 大量使用半透明、模糊效果，避免沉重感
2. **柔和感**: 圆角大、阴影淡、色彩柔和
3. **治愈感**: 暖色调背景、可爱元素（如猫咪图标）
4. **一致性**: 统一圆角、统一间距、统一色彩
5. **层次感**: 通过透明度、模糊度、阴影区分层级
6. **趣味性**: 适当使用emoji、动画效果增加活力

---

## 功能需求

### 1. 仪表盘 (首页)

#### 1.1 核心卡片模块

| 卡片名称 | 功能描述 | 数据来源 |
|---------|---------|---------|
| 首页图片 | 展示预设图片，点击跳转到照片墙 | Notion Database |
| 中心卡片 | 动态问候语 (Good Morning/Afternoon/Evening) + "I'm Raincat, Nice to meet you!" | 前端JS |
| 时钟 | 实时数字时钟 | 前端JS |
| 日历 | 月历视图，高亮今天 | 前端JS |
| 播放器 | 播放本地MP3，显示歌名、进度条、播放按钮 | 本地文件 |
| 社交链接 | 展示B站、小红书、Twitter、GitHub等 | 配置文件 |
| 随机推荐 | 从"我的项目"Database随机展示一个 | Notion Database |
| 最新文章 | 展示最新文章标题和简介 | Notion Database |
| 点赞卡片 | 显示全站总点赞数，点击为全站点赞 | Blog-Like API |
| 导航菜单 | 图标导航 (近期文章/我的项目/关于网站/推荐分享/优秀博客) | 配置文件 |
| 写文章按钮 | CTA按钮，跳转到Notion | 无 |
| 设置入口 | 控制卡片显示/隐藏、调整布局 | Notion Database |

#### 1.2 卡片交互

- **Hover效果**: 卡片悬停时轻微放大、增加阴影
- **点击交互**: 点击卡片跳转到对应页面或功能
- **拖拽布局**: 管理员模式下可拖拽卡片调整位置

### 2. 设置页面

#### 2.1 网站设置
- Favicon上传和配置
- Avatar头像设置
- 站点标题和用户名
- 站点描述
- 备案信息
- 社交按钮管理 (添加/删除/排序)

#### 2.2 色彩配置
- **基础颜色**: 主题色、次级主题色、主色、次色、背景色、边框色、卡片色、文章背景
- **背景颜色**: 预设配色方案 (春暖、秋实、深夜等)
- **功能**: 随机配色、添加自定义颜色

#### 2.3 首页布局
- 卡片参数配置 (宽度、高度、显示顺序、横向偏移、纵向偏移、启用状态)
- 拖拽布局模式
- 重置功能

#### 2.4 导入密钥
- 文件格式: JWT Token
- 功能: 验证管理员身份，获得修改权限
- 权限范围: 修改所有设置、管理内容

### 3. 文章系统

#### 3.1 文章列表页
- **分类维度**: 日/周/月/年/分类 五个子页面
- **年视图**: 按年份分组，每年一个卡片
- **时间线**: 卡片内用日期+虚线连接展示文章
- **已读标记**: 点击文章链接后显示"[已阅读]" (localStorage记录)
- **加载方式**: 无限滚动，逐步加载年份卡片
- **标签展示**: 文章右侧显示标签 (如 #Tech)，纯展示不可点击

#### 3.2 文章详情页
- **右侧边栏**:
  - 封面图
  - 摘要
  - 目录 (从Notion Blocks自动生成)
  - 点赞按钮 (调用 Blog-Like API)
  - 回到顶端按钮
- **文章内容支持**:
  - 标题 (H1/H2/H3/H4)
  - 文本
  - 代码块 (语法高亮)
  - 图片/视频
  - 数学公式 (LaTeX)
  - 表格
  - 引用块
  - 待办列表
  - 项目符号列表
  - 有序列表
  - 折叠列表

### 4. 照片墙

#### 4.1 展示效果
- **入场动画**: 照片从屏幕上方一张张飘落下来，随机旋转角度，错落有致地堆叠
- **点击放大**: 点击任意照片，平滑放大到屏幕中央，显示日期和描述 (黄色便利贴样式)
- **Hover效果**: 鼠标悬停时轻微放大、旋转归正、增加阴影

#### 4.2 管理员功能
- **删除照片**: 管理员模式下，照片右上角显示删除按钮
- **拖拽调整**: 可拖动照片重新排列位置
- **上传照片**: 支持多选上传，可添加统一描述

#### 4.3 数据来源
- 图片URL和描述信息存储在 Notion Database

### 5. 我的项目页

#### 5.1 展示形式
- **响应式网格布局**: 桌面多列，平板2列，手机1列
- **卡片内容**:
  - 封面图
  - 项目名称
  - 年份
  - 标签
  - 描述
  - 链接 (Website/GitHub)

#### 5.2 管理员功能
- 添加新项目
- 编辑项目信息
- 删除项目

### 6. 关于网站页

#### 6.1 页面布局
```
┌────────────────────────────────────────────┐
│              # RAINCAT                     │  ← 大号标题 (H1)
│              もしもし                         │  ← 日文问候语
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  # Hi! ✨ I'm wyb                    │  │
│  │                                       │  │
│  │  - 🌱 Born 2006-3-13 in China...   │  │  ← 个人信息列表
│  │  - I like to spend time on...       │  │     (无序列表，带emoji)
│  │  - I'm grateful to live in...       │  │
│  │  - I'm happy to contribute...       │  │
│  │  - If you're interested in...       │  │
│  │                                       │  │
│  │  > "The mission of learning..."     │  │  ← 引用语
│  │  > "Attempt to achieve..."          │  │
│  │                                       │  │
│  │  **For any suggestions... open an   │  │  ← 联系信息 (加粗)
│  │  issue in the xxx or     │  │     包含可点击链接
│  │  email me~**                         │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ❤️ xxx                                   │  ← 点赞按钮 (底部)
│                                            │
│   GitHub 图标                              │  ← GitHub链接图标
└────────────────────────────────────────────┘
```

#### 6.2 内容结构
- **页面标题**: 大号用户名显示 
- **问候语**: 日文/自定义问候语 (如 "もしもし")
- **正文区域**: 毛玻璃卡片包裹的 Markdown 内容
  - 个人信息列表 (带emoji的项目符号)
  - 引用语 (blockquote样式)
  - 联系方式 (加粗文本+可点击链接)
- **底部区域**:
  - 点赞按钮 (调用 Blog-Like API，独立计数)
  - GitHub 链接图标

#### 6.3 视觉风格
- 大标题居中显示，字号较大
- 问候语灰色/淡色，位于标题下方
- Markdown内容包裹在毛玻璃卡片中
- 列表项带emoji图标，增加趣味性
- 引用语用blockquote样式，有左边框装饰
- 联系信息加粗显示，链接可点击

#### 6.4 管理员功能
- 编辑页面标题
- 编辑问候语
- 编辑 Markdown 正文内容
- 编辑 GitHub 链接

### 7. 推荐分享页

#### 7.1 展示形式
- **横向Tab**: 分类筛选 (全部、OS、LLM、DB等)
- **卡片内容**:
  - 封面图
  - 标题
  - 链接
  - 分类标签
  - 描述
  - 浏览量
  - 点赞数

#### 7.2 管理员功能
- 添加新推荐
- 编辑推荐信息
- 删除推荐

### 8. 优秀博客页

#### 8.1 展示形式
- **搜索框**: 前端过滤，匹配博主名称/描述 (使用 fuse.js)
- **Tab切换**: 博客/链接 两个分类
- **卡片内容**:
  - 头像
  - 博主名称
  - URL
  - 星级评分
  - 描述
- **布局**: 响应式网格

#### 8.2 管理员功能
- 添加新博主
- 编辑博主信息
- 删除博主

---

## 非功能需求

### 1. 性能要求
- **首屏加载**: < 2秒
- **页面切换**: < 500ms
- **Notion API缓存**: ISR策略，仪表盘5分钟，文章页1分钟
- **图片优化**: 使用Next.js Image组件自动优化

### 2. 响应式设计
- **桌面端 (>1024px)**: 多列网格布局
- **平板端 (768-1024px)**: 2列布局
- **手机端 (<768px)**: 单列布局

### 3. 动画要求
- 使用 Framer Motion 实现
- 入场动画: 卡片依次淡入
- 交互动画: Hover、点击、拖拽
- 页面切换: 淡入淡出过渡

### 4. 安全性
- 管理员密钥验证 (JWT Token)
- 权限控制: 普通访客只读，管理员可读写
- 密钥存储在 cookie/session 中，刷新不丢失

### 5. SEO (不需要)
- 不生成 sitemap
- 不配置 Open Graph
- 不优化搜索引擎收录

---

## 技术栈

### 前端框架
- **Next.js 14+**: App Router、SSR/SSG/ISR
- **React 18+**: 组件化开发
- **TypeScript**: 类型安全

### 样式方案
- **Tailwind CSS**: 原子化CSS
- **CSS Modules**: 局部样式 (如需)

### 动画库
- **Framer Motion**: 声明式动画、手势交互、布局动画

### 图标库
- **Lucide React**: 线性图标

### 数据处理
- **Notion API**: 内容数据源
- **date-fns**: 日期处理
- **fuse.js**: 前端搜索过滤

### 部署平台
- **Vercel**: 一键部署、自动SSL、ISR支持

---

## 数据模型

### Notion Database 结构

#### 1. Articles Database (文章)
| 字段 | 类型 | 说明 |
|------|------|------|
| 标题 | Title | 文章标题 |
| Slug | Text | URL路径 |
| 封面图 | Files | 文章封面 |
| 摘要 | Text | 简短描述 |
| 标签 | Multi-select | 分类标签 |
| 分类 | Select | 文章分类 |
| 发布日期 | Date | 发布时间 |
| 隐藏 | Checkbox | 仅管理员可见 |

#### 2. Projects Database (项目)
| 字段 | 类型 | 说明 |
|------|------|------|
| 名称 | Title | 项目名称 |
| 封面图 | Files | 项目截图 |
| 年份 | Number | 项目年份 |
| 标签 | Multi-select | 技术标签 |
| 描述 | Text | 项目介绍 |
| Website URL | URL | 项目链接 |
| GitHub URL | URL | GitHub仓库 |

#### 3. Photos Database (照片墙)
| 字段 | 类型 | 说明 |
|------|------|------|
| 图片URL | URL | 图片地址 |
| 描述 | Text | 图片描述 |
| 日期 | Date | 拍摄/上传日期 |
| 排序 | Number | 显示顺序 |

#### 4. Bloggers Database (优秀博客)
| 字段 | 类型 | 说明 |
|------|------|------|
| 名称 | Title | 博主名称 |
| 头像 | Files | 博主头像 |
| URL | URL | 博客链接 |
| 星级 | Number | 评分 (1-5) |
| 描述 | Text | 简介 |
| 分类 | Select | 博客/链接 |

#### 5. Recommendations Database (推荐分享)
| 字段 | 类型 | 说明 |
|------|------|------|
| 名称 | Title | 推荐名称 |
| 封面图 | Files | 封面图片 |
| URL | URL | 链接地址 |
| 分类 | Select | 分类 (OS/LLM/DB等) |
| 标签 | Multi-select | 标签 |
| 描述 | Text | 简介 |
| 浏览量 | Number | 浏览次数 |
| 点赞数 | Number | 点赞次数 |

#### 6. About Page (关于网站)
- 单个 Notion Page，存储 Markdown 内容

#### 7. Settings Database (网站设置)
| 字段 | 类型 | 说明 |
|------|------|------|
| 配置类型 | Select | layout/colors/general |
| 配置内容 | JSON | 配置数据 |
| 更新时间 | Date | 最后修改时间 |

---

## 用户流程

### 1. 访客浏览流程
```
访问首页 → 浏览仪表盘 → 点击卡片/导航 → 查看内容 → 点赞/分享
```

### 2. 管理员管理流程
```
访问首页 → 点击设置 → 导入密钥 → 获得权限 → 修改设置/内容 → 保存 (同步到Notion)
```

### 3. 写文章流程
```
点击"写文章"按钮 → 跳转到Notion → 在Notion编辑器写文章 → 保存 → 博客自动更新 (ISR缓存)
```

---

## API 集成

### 1. Notion API
- **用途**: 获取所有动态内容
- **认证**: Internal Integration Token
- **调用频率**: ISR缓存控制

### 2. Blog-Like API
- **端点**: `https://blog-liker.yysuni1001.workers.dev/api/like`
- **GET**: 获取点赞数 (`?url=文章URL`)
- **POST**: 点赞 (`{url: "文章URL"}`)
- **用途**: 全站点赞、文章点赞、关于页点赞

---

## 文件结构

```
raincat-wiki/
├── public/
│   ├── music/
│   │   └── background.mp3          # 背景音乐
│   ├── images/                     # 静态图片
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── page.tsx                # 仪表盘首页
│   │   ├── layout.tsx              # 根布局 (导航栏)
│   │   ├── blog/
│   │   │   ├── page.tsx            # 文章列表 (年视图)
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # 文章详情页
│   │   ├── projects/
│   │   │   └── page.tsx            # 我的项目
│   │   ├── about/
│   │   │   ── page.tsx            # 关于网站
│   │   ├── share/
│   │   │   └── page.tsx            # 推荐分享
│   │   ├── bloggers/
│   │   │   └── page.tsx            # 优秀博客
│   │   ├── pictures/
│   │   │   └── page.tsx            # 照片墙
│   │   └── settings/
│   │       └── page.tsx            # 设置页面
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # 顶部导航栏
│   │   │   └── Footer.tsx
│   │   ├── widgets/
│   │   │   ├── Clock.tsx           # 时钟卡片
│   │   │   ├── Calendar.tsx        # 日历卡片
│   │   │   ├── Player.tsx          # 播放器卡片
│   │   │   ├── HeroImage.tsx       # 首页图片卡片
│   │   │   ├── WelcomeCard.tsx     # 中心欢迎卡片
│   │   │   ├── SocialLinks.tsx     # 社交链接
│   │   │   ├── RandomRecommend.tsx # 随机推荐
│   │   │   ├── LatestArticle.tsx   # 最新文章
│   │   │   └── LikeButton.tsx      # 点赞卡片
│   │   ├── settings/
│   │   │   ├── GeneralSettings.tsx # 网站设置
│   │   │   ├── ColorConfig.tsx     # 色彩配置
│   │   │   └── LayoutConfig.tsx    # 首页布局
│   │   └── shared/
│   │       ├── Card.tsx            # 通用卡片组件
│   │       ├── Modal.tsx           # 模态框
│   │       └── SearchInput.tsx     # 搜索框
│   ├── lib/
│   │   ├── notion.ts               # Notion API 封装
│   │   ├── blog-like.ts            # Blog-Like API 封装
│   │   ── auth.ts                 # 密钥验证
│   ├── hooks/
│   │   ├── useAdminAuth.ts         # 管理员权限Hook
│   │   └── useLocalStorage.ts      # 本地存储Hook
│   ├── types/
│   │   ── index.ts                # TypeScript 类型定义
│   └── config/
│       └── site.ts                 # 站点配置 (社交链接等)
├── package.json
└── next.config.js
```

---

## 开发计划

### 阶段1: 基础架构 (1-2周)
- [ ] 项目初始化 (Next.js + TypeScript + Tailwind)
- [ ] Notion API 集成
- [ ] 基础组件库 (Card、Modal等)
- [ ] 导航栏和布局

### 阶段2: 仪表盘开发 (2-3周)
- [ ] 各个Widget组件
- [ ] 毛玻璃样式和动画
- [ ] 响应式布局
- [ ] 时钟、日历、播放器功能

### 阶段3: 页面开发 (3-4周)
- [ ] 文章列表页 (年视图、时间线)
- [ ] 文章详情页 (右侧边栏、目录)
- [ ] 照片墙 (飘落动画、拖拽)
- [ ] 项目页、关于页、推荐页、博客页

### 阶段4: 设置系统 (1-2周)
- [ ] 设置页面UI
- [ ] 密钥验证系统
- [ ] 布局配置功能
- [ ] 色彩配置功能

### 阶段5: 优化和部署 (1周)
- [ ] 性能优化
- [ ] 动画调优
- [ ] Vercel部署
- [ ] 测试和Bug修复

---

## 风险和挑战

### 技术风险
1. **Notion API限流**: 需要合理设计缓存策略
2. **照片墙性能**: 大量照片时动画可能卡顿，需要虚拟列表优化
3. **移动端适配**: 仪表盘自由布局在手机上需要特殊处理

### 设计风险
1. **毛玻璃效果兼容性**: 某些浏览器可能不支持 backdrop-filter
2. **动画性能**: 复杂动画可能影响低端设备性能

### 内容风险
1. **Notion数据结构变更**: 需要预留扩展性
2. **图片加载速度**: 需要CDN或图片优化

---

## 成功指标

### 性能指标
- 首屏加载 < 2秒
- Lighthouse 性能评分 > 90
- Lighthouse 可访问性评分 > 90

### 功能指标
- 所有页面正常渲染
- 管理员功能完整可用
- 响应式布局正常工作

### 用户体验指标
- 动画流畅无卡顿
- 交互反馈及时
- 视觉风格统一美观

---

## 附录

### 参考网站
- **设计参考**: https://lvyovo-wiki.tech/
- **关于网站**: https://lvyovo-wiki.tech/about
- **照片墙**: https://lvyovo-wiki.tech/pictures
- **文章列表**: https://lvyovo-wiki.tech/blog
- **项目页**: https://lvyovo-wiki.tech/projects
- **推荐分享**: https://lvyovo-wiki.tech/share
- **优秀博客**: https://lvyovo-wiki.tech/bloggers

### 技术文档
- [Next.js Documentation](https://nextjs.org/docs)
- [Notion API Documentation](https://developers.notion.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Blog-Like GitHub](https://github.com/2010HCY/Blog-Like)
