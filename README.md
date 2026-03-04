# MyAssetsPage

基于 GitHub Issues 的个人资产管理与展示页面，使用 Nuxt 3 静态生成，部署在 GitHub Pages，**Fork 即用、完全免费**。

## ✨ 特性

- 📦 **GitHub Issues 即数据库** — 一个主 Issue + 评论 = 资产列表，无需后端或数据库
- ⚡ **Nuxt 3 SSG** — 构建时预渲染，访问速度快
- 🔄 **自动部署** — Issue / 评论变动自动触发 GitHub Actions 构建并发布到 GitHub Pages
- 📊 **资产总览仪表盘** — 总资产、日均成本、服役 / 退役 / 卖出统计一目了然
- 💰 **智能日均计算** — 服役中按至今天数计算，退役 / 卖出按实际使用天数计算，卖出资产自动扣除回收金额
- 🏷️ **多状态筛选** — 支持全部 / 服役中 / 已退役 / 已卖出分类查看
- 🎨 **移动端优先** — 清爽卡片式布局，适配各屏幕尺寸

## 🚀 使用步骤

1. **Fork** 本仓库到你的 GitHub 账号
2. 进入仓库 **Settings → Pages**，将 Source 设为 **GitHub Actions**
3. 进入 **Actions** 面板，点击 `I understand my workflows, go ahead and enable them` 启用工作流
4. 在 **Issues** 面板中，使用自带模板创建名为 **`Asset Database`** 的 Issue
5. （可选）在该 Issue 正文中配置页面标题和作者（格式见下方）
6. 在该 Issue 下方 **发表评论** 来添加资产
7. 等待 Actions 自动部署完成，打开你的 GitHub Pages 链接即可访问！

## ⚙️ Issue 正文配置（可选）

在 `Asset Database` Issue 的正文中，可以设置页面标题和描述：

```md
---
title: Leoon 的个人资产
author: Leoon
---
```

| 字段     | 说明          |
| -------- | ------------- |
| `title`  | 页面主标题    |
| `author` | 页面描述/作者 |

## 📦 资产格式（评论内容）

在 `Asset Database` Issue 下的每条评论代表一个资产，使用 YAML FrontMatter 格式：

### 服役中资产（status: 1）

```md
---
name: MacBook Pro M3
date: 2024-01-15
cover: https://example.com/macbook.png
price: 14999
status: 1
---
```

### 已退役资产（status: 0）

```md
---
name: iPhone 13
date: 2021-09-24
cover: https://example.com/iphone13.png
price: 6799
status: 0
retire_date: 2024-09-20
retire_reason: 换新机
---
```

### 已卖出资产（status: 2）

```md
---
name: Nintendo Switch OLED
date: 2022-03-10
cover: https://example.com/switch.png
price: 2599
status: 2
sell_date: 2024-06-15
sell_price: 1800
---
```

### 字段说明

| 字段            | 必填 | 说明                                         |
| --------------- | ---- | -------------------------------------------- |
| `name`          | ✅   | 资产名称                                     |
| `date`          | ✅   | 购入日期（`YYYY-MM-DD`）                     |
| `cover`         | ✅   | 封面图 URL                                   |
| `price`         | ✅   | 购入价格                                     |
| `status`        | ✅   | `1` 服役中 · `0` 已退役 · `2` 已卖出        |
| `retire_date`   | ❌   | 退役日期（status 为 0 时使用）               |
| `retire_reason` | ❌   | 退役原因（如"换新机"、"损坏"等）             |
| `sell_date`     | ❌   | 卖出日期（status 为 2 时使用）               |
| `sell_price`    | ❌   | 卖出价格（用于计算日均净成本和回血比例）     |

### 💡 日均成本计算规则

- **服役中**：`购入价格 ÷ (今天 − 购入日期)` 天
- **已退役**：`购入价格 ÷ (退役日期 − 购入日期)` 天
- **已卖出**：`(购入价格 − 卖出价格) ÷ (卖出日期 − 购入日期)` 天

## 🛠 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 静态生成
pnpm generate

# 预览生成结果
pnpm preview
```

## 📁 项目结构

```
my-assets-page/
├── .github/
│   ├── ISSUE_TEMPLATE/    # Issue 模板（自动创建 Asset Database）
│   └── workflows/         # GitHub Actions 自动部署配置
├── pages/
│   └── index.vue          # 主页面（仪表盘 + 资产卡片列表）
├── server/
│   └── api/assets.ts      # API 接口（读取 GitHub Issue 评论）
├── public/                # 静态资源
├── nuxt.config.ts         # Nuxt 配置（SSG + GitHub Pages preset）
└── package.json
```

## 📄 License

MIT
