<!--
  ┌──────────────────────────────────────────────────────────┐
  │                                                        │
  │   > Project Name                                        │
  │                                                        │
  │   TBA  —  a self‑hosted local video streaming server   │
  │   with a rich web player and library browser.           │
  │                                                        │
  └──────────────────────────────────────────────────────────┘
-->

<p align="center">
  <h1 align="center">🎬 VideoWebSite</h1>
  <p align="center"><i>A self-hosted, browser-based local video streaming server with a rich player and media library browser — your personal Netflix for local files.</i></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node.js 18+">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Platform">
</p>

---

**中文** | [English](#english)

---

# 🎬 VideoWebSite

一个自托管的本地视频流媒体服务器，基于 Node.js + Express。通过浏览器即可浏览、搜索和播放本地视频文件，提供类似 Netflix 的观影体验。

支持 PC / 移动端自适应，暗色主题，零前端框架依赖。

---

## ✨ 功能特性

### 📂 视频管理
- **递归目录扫描** — 自动发现项目目录及子目录中的所有视频，支持 `.mp4` `.mkv` `.avi` `.mov` `.flv` `.wmv` `.webm` `.ogg`
- **外部路径** — 支持配置任意数量的外部视频目录，每个目录自动挂载为独立路由
- **智能排序** — 文件名自然排序（支持数字序号），支持按名称、文件夹、最近播放排序
- **多种视图** — 首页支持 **网格** / **列表** / **卡片** / **目录树** 四种浏览模式
- **文件夹标签** — 一键按顶层文件夹筛选视频
- **实时搜索** — VSCode 风格搜索栏，支持：
  - 🔍 按路径搜索（匹配完整相对路径而非仅文件名）
  - 🔤 全字匹配
  - 🔠 大小写敏感

### ▶️ 播放控制
- **Play / Pause**：合并为单一按钮 + 视频画面中央大按钮覆盖层
- **进度条**：可拖拽/点击定位，支持触摸滑动，悬停时高度扩张
- **音量控制**：滑块 0-100% + 一键静音，偏好自动保存
- **倍速播放**：0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x，偏好自动保存
- **时间跳转**：
  - 主控栏：±10s（移动端 ±15s）
  - 扩展栏：-5min / -1min / -15s | +15s / +1min / +5min
- **画中画 (PiP)**：支持浏览器原生悬浮小窗播放
- **全屏**：按钮 / 双击视频 / 键盘 `F` 切换，全屏空闲 3.5s 后自动隐藏控件
- **网页全屏**：填充浏览器视口但保留顶栏
- **宽屏模式**：视频区域拉满整个浏览器宽度

### 🎨 界面设计
- **暗色主题** — 深色电影感配色，CSS 变量体系，护眼舒适
- **响应式布局** — PC 端左侧固定侧边栏 + 右侧播放区；移动端侧边栏变为**底部抽屉**，上滑展开、下滑关闭
- **触摸手势** — 视频区域左右滑动快进/快退，进度条支持触摸拖拽
- **全触屏适配** — 所有交互按钮 ≥44px

### ⌨️ 键盘快捷键

| 按键 | 功能 |
|---|---|
| `Space` / `K` | 播放 / 暂停 |
| `←` / `→` | 快退 / 快进 10s |
| `Shift + ←/→` | 快退 / 快进 1min |
| `Ctrl + ←/→` | 快退 / 快进 5s |
| `↑` / `↓` | 音量 ±5% |
| `M` | 静音切换 |
| `F` | 全屏切换 |
| `W` | 宽屏模式切换 |
| `T` | 侧边栏切换 |
| `1` ~ `9` | 直接播放对应序号的视频 |
| `Esc` | 关闭移动端侧边栏 / 退出全屏 |

### 💾 偏好记忆
通过 `localStorage` 自动持久化，刷新后恢复：
音量、播放速度、侧边栏视图模式、搜索选项、宽屏/网页全屏状态、首页视图与排序、最近播放记录（最多 20 条）

### 🖼️ 缩略图自动生成
- 使用 **ffmpeg** 提取每个视频第 1 秒的帧，生成 480px 宽的 `.webp` 缩略图
- 按文件路径 MD5 缓存至 `thumbnails/` 目录，避免重复生成
- 启动时后台异步生成缺失的缩略图
- 首页网格/列表/卡片视图均展示缩略图，加载失败时优雅降级

### 🖥️ Windows 启动器 (launcher.ps1)
- 图形化桌面启动器（PowerShell + WinForms），暗色主题
- 可视化管理端口、外部视频目录
- 一键启动/停止服务器，实时显示 Node.js 输出日志
- 配置自动保存/导出/导入（JSON）
- 启动时自动打开浏览器（可关闭）

---

## 📸 效果展示

<!-- TODO: add screenshots -->
> *截图待补充*

---

## 🚀 快速开始

### 环境要求
- **Node.js** 18+ LTS
- **ffmpeg**（可选，推荐）— 用于生成视频缩略图。需在 PATH 中或设置 `FFMPEG_PATH`

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 将视频文件放入项目目录（或任意子目录）

# 3. 启动服务器
npm start
```

浏览器访问 `http://localhost:4007`。

### 自定义端口

```bash
# Linux / macOS
PORT=8080 npm start

# Windows PowerShell
$env:PORT=8080; npm start
```

### 添加外部视频目录

```bash
# Linux / macOS — 分号分隔
VIDEO_PATHS="/mnt/videos;/mnt/movies" npm start

# Windows PowerShell — 分号分隔
$env:VIDEO_PATHS="D:\Movies;E:\TV"; npm start

# 使用启动器 (Windows)
powershell -ExecutionPolicy Bypass -File launcher.ps1
```

---

## ⚙️ 配置选项

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `4007` | 服务监听端口（绑定 `0.0.0.0`） |
| `VIDEO_PATHS` | (空) | 分号分隔的外部视频目录绝对路径 |
| `FFMPEG_PATH` | `ffmpeg` | ffmpeg 可执行文件路径 |
| `THUMB_DIR` | `./thumbnails` | 缩略图缓存目录（自动创建） |

---

## 📁 项目结构

```
VideoWebSite/
├── server.js              # Express 后端 — 视频扫描 / API / 静态服务 / 缩略图生成
├── package.json            # 项目配置与依赖
├── launcher.ps1            # Windows 图形化启动器 (PowerShell + WinForms)
├── public/
│   ├── index.html          # 前端主页面
│   ├── scripts.js          # 前端逻辑 (IIFE, ~1400 行)
│   └── styles.css          # 暗色主题样式 (CSS 变量, ~1650 行)
├── thumbnails/             # 缩略图缓存目录 (gitignored, 自动生成)
├── testvideo/              # 测试视频 (gitignored)
└── node_modules/           # 依赖 (gitignored)
```

---

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | Node.js |
| 后端框架 | Express 4.x |
| 前端 | 原生 HTML5 / CSS3 / JavaScript (ES6+)，零框架 |
| 视频播放 | HTML5 `<video>` |
| 图标 | 内联 SVG（零外部依赖） |
| 缩略图 | ffmpeg (child_process) |
| 桌面启动器 | PowerShell 5.1 + .NET WinForms |

---

## 🔮 未来计划

- [ ] **外挂字幕** — 加载 `.srt` / `.vtt` 字幕文件
- [ ] **播放列表模式** — 顺序 / 随机 / 循环播放
- [ ] **断点续播** — 记住播放进度，下次自动恢复
- [ ] **拖拽导入** — 拖拽视频文件至页面直接播放
- [ ] **网络流媒体** — 支持输入 URL 播放远程视频
- [ ] **进度条缩略图预览** — 悬停进度条时显示对应时间点画面
- [ ] **PWA 支持** — Service Worker 实现离线访问
- [ ] **热重载开发模式** — `npm run dev` 集成 nodemon
- [ ] **访问控制** — 可选的密码保护
- [ ] **CSP 安全头** — Content-Security-Policy

---

## ❓ 常见问题

**Q: 缩略图不显示？**
A: 确保已安装 ffmpeg 且在 PATH 中。可运行 `ffmpeg -version` 验证。也可通过 `FFMPEG_PATH` 环境变量指定路径。

**Q: 如何添加外部硬盘上的视频？**
A: 通过 `VIDEO_PATHS` 环境变量或使用 Windows 启动器添加路径。每个外部目录会被独立挂载，互不干扰。

**Q: 移动端怎么打开侧边栏？**
A: 点击左上角 ☰ 菜单按钮，侧边栏从底部滑出（抽屉式）。下滑或点击遮罩关闭。

**Q: 端口被占用怎么办？**
A: 指定其他端口：`PORT=8080 npm start`。使用启动器时会自动检测并释放被占用的端口。

---

## 📄 License

[MIT](LICENSE)

---

---

<a id="english"></a>

# 🎬 VideoWebSite

A self-hosted, browser-based local video streaming server built with Node.js + Express. Browse, search, and play your local video collection through a Netflix-like web interface.

Fully responsive for PC and mobile, dark theme, zero frontend framework dependencies.

---

## ✨ Features

### 📂 Media Library
- **Recursive scanning** — auto-discovers videos in the project directory and subdirectories. Supports `.mp4` `.mkv` `.avi` `.mov` `.flv` `.wmv` `.webm` `.ogg`
- **External directories** — configure any number of external video paths, each mounted as a separate route
- **Smart sorting** — natural sort with numeric awareness; sort by name, folder, or recently played
- **Multiple views** — homepage supports **Grid** / **List** / **Card** / **Tree** layouts
- **Folder tabs** — filter videos by top-level folder with one click
- **Real-time search** — VSCode-style search with three toggle options:
  - 🔍 Path search (match against full relative path)
  - 🔤 Whole word matching
  - 🔠 Case sensitivity

### ▶️ Playback Controls
- **Play / Pause** — unified toggle button + large center overlay button on pause
- **Progress bar** — draggable/clickable seek with touch support; expands on hover
- **Volume** — slider (0–100%) + mute toggle; preference auto-saved
- **Playback speed** — 0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x; preference auto-saved
- **Time jumps** —
  - Main row: ±10s (±15s on mobile)
  - Extended row: -5min / -1min / -15s | +15s / +1min / +5min
- **Picture-in-Picture (PiP)** — native browser floating player
- **Fullscreen** — button / double-click video / `F` key; controls auto-hide after 3.5s of inactivity
- **Web fullscreen** — fills the browser viewport, keeps topbar visible
- **Widescreen** — stretches the video wrapper edge-to-edge

### 🎨 UI / UX
- **Dark cinematic theme** — CSS variables, easy on the eyes
- **Responsive layout** — PC: fixed left sidebar + player area; Mobile: sidebar becomes a **bottom drawer** (swipe up to open, swipe down / tap overlay to close)
- **Touch gestures** — horizontal swipe on video area to skip, touch-drag progress bar
- **Finger-friendly** — all interactive elements ≥ 44px on mobile

### ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` / `K` | Play / Pause |
| `←` / `→` | Skip -10s / +10s |
| `Shift + ←/→` | Skip -1min / +1min |
| `Ctrl + ←/→` | Skip -5s / +5s |
| `↑` / `↓` | Volume ±5% |
| `M` | Mute toggle |
| `F` | Fullscreen toggle |
| `W` | Widescreen toggle |
| `T` | Sidebar toggle |
| `1` ~ `9` | Play video #1 through #9 |
| `Esc` | Close mobile sidebar / exit fullscreen |

### 💾 Persistent Preferences
All stored in `localStorage`, restored on page load:
volume, playback speed, sidebar view mode, search options, widescreen/web-fullscreen state, homepage view & sort, recently played (up to 20 entries)

### 🖼️ Thumbnail Generation
- Uses **ffmpeg** to capture frame at 1s, generating a 480px-wide `.webp` thumbnail
- Cached by file-path MD5 in `thumbnails/` directory
- Background async generation on startup for missing thumbnails
- Displayed in grid/list/card homepage views; graceful fallback on failure

### 🖥️ Windows Launcher (launcher.ps1)
- GUI desktop launcher (PowerShell + WinForms), dark themed
- Manage port, external video directories visually
- One-click start/stop server with live Node.js output log viewer
- Config auto-save / export / import (JSON)
- Auto-open browser on start (toggleable)

---

## 📸 Screenshots

<!-- TODO: add screenshots -->
> *To be added*

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ LTS
- **ffmpeg** (optional, recommended) — for thumbnail generation. Must be on PATH or set `FFMPEG_PATH`

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Place your video files in the project directory (or subdirectories)

# 3. Start the server
npm start
```

Open `http://localhost:4007` in your browser.

### Custom Port

```bash
# Linux / macOS
PORT=8080 npm start

# Windows PowerShell
$env:PORT=8080; npm start
```

### External Video Directories

```bash
# Linux / macOS
VIDEO_PATHS="/mnt/videos;/mnt/movies" npm start

# Windows PowerShell
$env:VIDEO_PATHS="D:\Movies;E:\TV"; npm start

# Via the launcher (Windows)
powershell -ExecutionPolicy Bypass -File launcher.ps1
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4007` | Server port (binds to `0.0.0.0`) |
| `VIDEO_PATHS` | (empty) | Semicolon-separated absolute paths to external video directories |
| `FFMPEG_PATH` | `ffmpeg` | Path to ffmpeg executable |
| `THUMB_DIR` | `./thumbnails` | Thumbnail cache directory (auto-created) |

---

## 📁 Project Structure

```
VideoWebSite/
├── server.js              # Express backend — video scanning / API / static serving / thumbnails
├── package.json            # Project config & dependencies
├── launcher.ps1            # Windows GUI launcher (PowerShell + WinForms)
├── public/
│   ├── index.html          # Frontend HTML
│   ├── scripts.js          # Frontend logic (IIFE, ~1400 lines)
│   └── styles.css          # Dark theme styles (CSS variables, ~1650 lines)
├── thumbnails/             # Thumbnail cache (gitignored, auto-generated)
├── testvideo/              # Test videos (gitignored)
└── node_modules/           # Dependencies (gitignored)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express 4.x |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (ES6+), zero frameworks |
| Video | HTML5 `<video>` |
| Icons | Inline SVG (zero external dependencies) |
| Thumbnails | ffmpeg (child_process) |
| Launcher | PowerShell 5.1 + .NET WinForms |

---

## 🔮 Roadmap

- [ ] **Subtitle support** — load `.srt` / `.vtt` subtitle files
- [ ] **Playlist mode** — sequential / shuffle / loop playback
- [ ] **Resume playback** — remember progress, resume on next play
- [ ] **Drag & drop import** — drag video files onto the page to play
- [ ] **Network streaming** — play remote videos via URL input
- [ ] **Progress bar thumbnail preview** — hover preview frame at cursor position
- [ ] **PWA support** — Service Worker for offline access
- [ ] **Dev mode with hot reload** — `npm run dev` with nodemon
- [ ] **Access control** — optional password protection
- [ ] **CSP headers** — Content-Security-Policy

---

## ❓ FAQ

**Q: Thumbnails are not showing up?**
A: Make sure ffmpeg is installed and on your PATH. Verify with `ffmpeg -version`. You can also set `FFMPEG_PATH` to point to the executable.

**Q: How do I add videos from an external drive?**
A: Use the `VIDEO_PATHS` environment variable or the Windows launcher to add paths. Each external directory is mounted independently.

**Q: How do I open the sidebar on mobile?**
A: Tap the ☰ menu button in the top-left corner. The sidebar slides up from the bottom as a drawer. Swipe down or tap the overlay to dismiss.

**Q: The port is already in use?**
A: Specify a different port: `PORT=8080 npm start`. The Windows launcher automatically detects and frees occupied ports.

---

## 📄 License

[MIT](LICENSE)
