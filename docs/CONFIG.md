# 配置文档

本文档说明站点的所有可配置项及其位置。改动后无需构建，刷新页面即可生效。

## 1. 本人编辑模式（重要）

博客「写点什么」和友链「添加链接」两个编辑板块，默认只对访客隐藏，仅本人可见。

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 秘密密钥 | `js/shared.js` → `EDIT_KEY` | 当前值 `yohon0721`，建议改成你自己的字符串 |
| 存储 key | `js/shared.js` → `EDIT_STORAGE` | 编辑模式状态存储于 localStorage 的 key |

**使用方式**：

- 开启编辑模式：访问 `https://你的域名/index.html?edit=yohon0721`
- 关闭编辑模式：访问 `https://你的域名/index.html?edit=off`

开启后状态会一直保持（存在 localStorage），直到你手动关闭或清除浏览器数据。

> ⚠️ 这是「隐藏入口」，不是真正的安全鉴权。密钥写在前端 JS 里，懂技术的访客查看源码即可得知。如需真正的权限控制，需要后端。

## 2. 个人信息

位置：`js/script.js` → `personal`

```js
const personal = {
  info: [
    { key: "姓名", val: "幽鸿" },
    { key: "身份", val: "苦逼高中生qwq" },
    // ... 左侧「个人信息」列表
  ],
  meta: [
    { key: "MBTI", val: "INFP" },
    // ... 右侧列表
  ]
};
```

- `info`：左侧「个人信息」卡片内容
- `meta`：右侧附加信息
- 带 `dot: true` 的条目会显示一个绿色状态点

「自介」正文是静态 HTML，在 `index.html` 的 `#about` 区块内直接编辑。

## 3. 社交 / 联系图标

位置：`js/script.js` → `socials`

```js
const socials = [
  { icon: "𝕏", label: "推特", href: "https://x.com/YoHon11638", img: "piv/X.png", type: "link" },
  { icon: "🐧", label: "QQ", copy: "1923497173", img: "piv/qq.png", type: "copy" },
  { icon: "▶️", label: "Youtube", href: "https://www.youtube.com/@YoHon-c2n4e", img: "piv/youtube.svg", type: "link" },
  { icon: "🐙", label: "GitHub", href: "https://github.com/YouHon-star", img: "piv/github.png", type: "link" },
  { icon: "📧", label: "邮箱", copy: "yohon2348@gmail.com", img: "piv/email.png", type: "copy" }
];
```

字段说明：

- `type: "link"` — 点击新标签页打开 `href`
- `type: "copy"` — 点击复制 `copy` 的值到剪贴板并弹 Toast
- `img` — 图标路径（`piv/` 目录下）；留空则使用 `icon` 文字

图标同时用于首页 hero 区和「联系」区。所有图标会统一着色为单色（浅色黑/深色白）。

## 4. 音乐播放器

位置：`js/script.js` → `playlist`

```js
const playlist = [
  { title: "リリィ", artist: "倚水/吐息.", src: "music/リリィ(feat. 倚水).mp3", cover: "music-Picture/吐息.jpg", color: ["#ff5c8a", "#9b6bff"] },
  // ...
];
```

字段说明：

- `title` / `artist` — 曲名 / 歌手
- `src` — 音频路径（`music/` 目录）
- `cover` — 封面路径（`music-Picture/` 目录）
- `color` — 封面渐变的两个颜色

添加歌曲时把音频放到 `music/`、封面放到 `music-Picture/`，再在数组里加一条即可。

## 5. 背景图片

位置：`js/shared.js` → `bgImages`

```js
const bgImages = [
  "Background/1.jpg",
  "Background/2.png",
  "Background/3.jpg",
  "Background/4.jpg"
];
```

按顺序轮播，间隔约 6 秒（`initBgSlideshow` 里的 `6000` 毫秒可调）。

## 6. 看板娘（Live2D）

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 模型路径 | `js/shared.js` → `initLive2D()` 里的 `modelPath` | 当前 `live2d/空 - 免费版.model3.json` |
| 缩放 | 同函数里的 `ZOOM` | 当前 `1.9`，调大看板娘更大 |
| 随机台词 | `js/shared.js` → `catMessages` | 看板娘定时气泡的候选文案 |
| 页面问候 | `js/shared.js` → `pageGreetings` | 切换到首页/博客/友链时的问候语 |

> 模型文件路径含中文和空格，代码里用 `encodeURI` 做了编码，请勿改动文件名。

## 7. 打字机文案

位置：`js/script.js` → `typedWords`

```js
const typedWords = ["懒懒", "失眠", "穷穷", "无聊"];
```

首页 hero 区「一只 xxx 的死宅猫猫」中循环打字的词汇。

## 8. 主题

位置：`js/shared.js`（自动处理）

- 默认跟随系统 `prefers-color-scheme`
- 用户手动切换后写入 `localStorage` 的 `theme`（`light` / `dark`）
- 导航栏右侧月亮/太阳按钮切换

## 9. localStorage 数据说明

| key | 内容 | 说明 |
|-----|------|------|
| `theme` | `light` / `dark` | 主题 |
| `anonymous_messages` | JSON 数组 | 匿名留言板 |
| `site_posts` | JSON 数组 | 博客文章 |
| `site_links` | JSON 数组 | 友情链接 |
| `yohon_edit_mode` | `1` / 无 | 编辑模式开关 |

> 这些数据只存在访客自己的浏览器里，换设备/换浏览器不会同步。要迁移数据，可在浏览器 DevTools 里导出对应的 localStorage。
