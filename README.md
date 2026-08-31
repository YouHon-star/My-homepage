# 幽鸿の小站（My-homepage）

一个纯原生 HTML/CSS/JS 构建的个人主页，集成了 Live2D 看板娘、音乐播放器、博客、友链、匿名留言板等功能。

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | 无（纯 vanilla HTML + CSS + JavaScript） |
| 动画 | CSS 动画 + IntersectionObserver |
| 看板娘 | PixiJS + pixi-live2d-display（cubism4）+ Cubism 4 核心 |
| 导航 | 自研 PJAX 无刷新导航（History API） |
| 存储 | localStorage |
| 字体 | Google Fonts（ZCOOL KuaiLe / Noto Sans SC / JetBrains Mono） |

## 目录结构

```
My-homepage/
├── index.html            # 首页（壳页面：hero 卡片、关于、留言板、联系）
├── log.html              # 博客页
├── links.html            # 友链页
├── css/
│   └── style.css         # 全部样式（玻璃拟态 + 动漫风）
├── js/
│   ├── shared.js         # 持久层（主题/背景/粒子/看板娘/编辑模式/Toast）
│   ├── pjax.js           # PJAX 引擎（链接拦截、fetch 替换、路由）
│   ├── script.js         # 首页模块 HomeApp（时钟/打字机/音乐/留言板/社交）
│   ├── log.js            # 博客模块 BlogApp + 友链模块 LinksApp
│   └── lib/              # 第三方库
│       ├── pixi.min.js           # PixiJS（渲染 Live2D）
│       ├── cubism4.min.js        # pixi-live2d-display
│       └── live2dcubismcore.min.js # Cubism 4 核心
├── live2d/               # Live2D 模型文件（中文文件名，勿改名）
│   ├── 空 - 免费版.model3.json
│   ├── 空 - 免费版.moc3
│   └── 空 - 免费版.8192/  # 8192×8192 纹理贴图
├── Background/           # 首页背景轮播图片（1.jpg/2.png/3.jpg/4.jpg）
├── Icon/                 # 站点 favicon（tab-32.png / tab-256.png）
├── music/                # 音乐播放器音频文件
├── music-Picture/        # 音乐封面图片
├── piv/                  # 社交图标 + 看板娘显示/隐藏图标
└── profile-picture/      # 头像
```

## 各模块职责

- **shared.js**：全局唯一、永不销毁的持久层。负责主题切换、背景轮播、粒子特效、导航滚动、回到顶部、页脚、运行时间、看板娘（Live2D）初始化与交互、页面切换气泡、复制提示 Toast、编辑模式。
- **pjax.js**：拦截站内 `<a>` 点击，用 `fetch` 拉取目标页面的 `#pjax-main` 内容并替换，实现无刷新导航；看板娘和导航栏不随页面切换销毁。
- **script.js**：首页模块，注册为 `home` 页面。渲染个人信息、社交图标、音乐播放器、时钟、打字机、留言板。
- **log.js**：注册 `blog` 和 `links` 两个页面模块。博客的增删查、分类/标签/归档/搜索、友链的增删。

## 本地运行

项目是纯静态站点，需要 HTTP 服务（不能直接双击 `file://` 打开，否则 `fetch` 会因 CORS 失败）：

```bash
# 在项目根目录执行
python -m http.server 8000
```

然后浏览器访问 <http://localhost:8000>。

## 部署

任何静态托管均可，例如：

```nginx
server {
    listen 80;
    server_name example.com;
    root /path/to/My-homepage;
    index index.html;

    # 大文件（Live2D 模型/音乐）建议加长缓存
    location ~* \.(moc3|json|png|jpg|mp3)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

> 注意：`live2d/` 和 `music/` 目录里的文件名含中文和空格，请勿随意改名，部署时保持目录结构完整。

## 数据存储

站点所有用户数据都存在浏览器 localStorage 中（详见「配置文档」），无后端数据库：

- `theme` — 主题（light/dark）
- `anonymous_messages` — 匿名留言板
- `site_posts` — 博客文章
- `site_links` — 友情链接
- `yohon_edit_mode` — 本人编辑模式开关

详细配置说明见 [docs/CONFIG.md](docs/CONFIG.md)。
