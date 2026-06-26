<p align="center">
  <img src="docs/images/logo.gif" alt="iAnonVideo" width="120">
  <h1 align="center">iAnonVideo</h1>
  <p align="center"><b>Virtual Media Library · Immersive Viewing · One Server, Whole Family</b></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Platform">
</p>

---

## Goodbye Fragmented Storage — Virtual Media Library

**Mount your scattered video directories — across multiple hard drives, NAS devices, USB sticks, and external storage — into a single unified virtual library. No file migration, no reorganization. Just open a browser and start watching.**

---

## 🎯 The Problem It Solves

Home video collections tend to sprawl: some movies on the D: drive, TV series on the NAS, documentaries on an external HDD, and a few family clips on a USB stick. They're scattered across different paths, making it nearly impossible to browse your entire collection unless you manually copy everything to one place — which is painfully slow and destroys your existing folder structures.

**iAnonVideo's answer: don't move files. Mount directories.**

---

## ✨ Key Features

### 🗂️ Virtual Media Library — Multi-Source Mounting

This is what sets iAnonVideo apart.

Add any number of directories from different physical drives — `D:\Movies`, `E:\TV`, `\\nas\media`, even external USB drives — and iAnonVideo merges them into **one unified browsing view**. Your folder hierarchies are preserved exactly as you organized them, but they all appear together as a single cohesive library.

- 🔗 **Mount, don't migrate** — files stay where they are, zero reorganization needed
- 🗃️ **Virtual aggregation** — browse, search, and sort across all sources in one interface
- 📂 **Folder tree view** — expand/collapse your original directory structure
- 🏷️ **Folder tabs** — filter to a single source with one click
- 🔍 **VSCode-style search** — search by full path, whole word, or case-sensitive

> Stop fighting your file system. Let iAnonVideo make your scattered collection feel like one library.

---

### 🎬 Cinematic Viewing Experience

No bloated features, no complexity — just the cleanest viewing experience. Start a video and the interface transforms into distraction-free playback. A dark cinematic theme with auto-hiding controls keeps you immersed in the content, not the UI.

- **Cinema Mode** — controls fade out after 3.5s of inactivity in fullscreen; reappear on the slightest mouse movement
- **Widescreen Mode** — stretches video edge-to-edge, ideal for ultrawide monitors and projectors
- **Picture-in-Picture** — pop-out floating player; watch while multitasking
- **Adaptive Streaming** — HTML5 `<video>` with on-demand buffering
- **Touch Gestures** — horizontal swipe to skip, drag to seek on mobile

---

### 🏠 Home Theater — Deploy Once, Watch Everywhere

iAnonVideo is a standard web service. Deploy it on a home server, NAS, or any always-on computer. Every device in your home network can access it through a browser:

| Device | How |
|---|---|
| 📱 Phone / Tablet | Open `http://<server-ip>:4007` in browser |
| 💻 Laptop / Desktop | Same |
| 📺 Smart TV | Use the TV's browser |

Native dual-platform UI. Mobile layout adapts automatically: the sidebar becomes a bottom drawer — swipe up to open, swipe down to dismiss, thumb-friendly throughout.

**One machine runs the server. The whole family watches simultaneously — different videos, different devices, no conflicts.**

---

## 📸 Screenshots

<p align="center">
  <img src="docs/images/manager.png" width="48%" alt="Media Browser">
  <img src="docs/images/player.png" width="48%" alt="Video Player">
</p>

---

### 🖥️ Windows Desktop Launcher — Zero Command Line

The project includes a desktop launcher built with PowerShell + WinForms:

- 🎛️ **Visual configuration** — set port, add/remove video directories with a folder picker
- ▶️ **One-click start/stop** — no terminal needed
- 📋 **Live log viewer** — embedded console shows real-time server output
- 💾 **Auto-save config** — port and paths are remembered across restarts
- 📤 **Import / Export** — save configuration as JSON for backup or migration

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ LTS ([Download](https://nodejs.org/))
- **ffmpeg** (optional, recommended) — for generating video thumbnails. Without it, videos play fine — just no cover images.

---

### Windows

**Option 1: Desktop Launcher (recommended — no commands required)**

Right-click `launcher.ps1` and select "Run with PowerShell".

A GUI window opens with everything you need:
1. Set the **port** (default 4007)
2. Click **"+ Add Path"** to add your video folders (as many as you like)
3. Click **"Start Server"**
4. If "Auto-open browser" is checked, it opens automatically; otherwise visit `http://localhost:4007`

```powershell
# If you run into execution policy restrictions, use this from the project directory:
powershell -ExecutionPolicy Bypass -File launcher.ps1
```
> ℹ️ `-ExecutionPolicy Bypass` is a PowerShell safety parameter that allows running local scripts for this session only. It does not change system settings permanently. See FAQ below.

**Option 2: Command Line**

```bash
npm install
npm start
```

Open `http://localhost:4007`.

To mount external video directories via environment variables:
```powershell
$env:PORT=8080
$env:VIDEO_PATHS="D:\Movies;E:\TV"
npm start
```

---

### Linux / macOS

```bash
# 1. Install dependencies
npm install

# 2. Start the server (default port 4007)
npm start

# 3. Mount external video directories via environment variables
VIDEO_PATHS="/mnt/videos:/mnt/movies" PORT=8080 npm start
```

Open `http://localhost:4007` (or your custom port).

> **Tip:** Separate multiple video directories with `;` or `:`. The server recursively scans each one and merges them into a single unified browsing view.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4007` | Server port |
| `VIDEO_PATHS` | (empty) | External video directories, separated by `;` |
| `FFMPEG_PATH` | `ffmpeg` | Path to ffmpeg executable |
| `THUMB_DIR` | `./thumbnails` | Thumbnail cache directory |

---

## 📁 Project Structure

```
iAnonVideo/
├── server.js          # Express backend: video scanning / API / static serving / thumbnails
├── package.json        # Project config & dependencies
├── launcher.ps1        # Windows GUI launcher
├── public/
│   ├── index.html      # Frontend HTML
│   ├── scripts.js      # Frontend logic (~1400 lines, IIFE pattern)
│   └── styles.css      # Dark theme styles (~1650 lines, CSS custom properties)
├── thumbnails/         # Thumbnail cache (auto-generated)
└── node_modules/       # Dependencies
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express 4.x |
| Frontend | Vanilla HTML5 / CSS3 / JS (ES6+), zero frameworks |
| Video | HTML5 `<video>` |
| Icons | Inline SVG |
| Thumbnails | ffmpeg |
| Windows Launcher | PowerShell 5.1 + WinForms |

---

## 🔮 Roadmap

- [ ] Subtitle support (`.srt` / `.vtt`)
- [ ] Playlist mode (sequential / shuffle / loop)
- [ ] Resume playback
- [ ] PWA offline support
- [ ] Optional password protection
- [ ] Drag-and-drop video import
- [ ] Progress bar hover thumbnail preview

---

## ❓ FAQ

**Q: Is `powershell -ExecutionPolicy Bypass` safe?**

Yes. It temporarily allows running the launcher script for this session only. Windows PowerShell blocks unsigned scripts by default, so this parameter is necessary. It does not change any system settings permanently. If you prefer, you can also right-click `launcher.ps1` → "Run with PowerShell".

**Q: Thumbnails are not showing up?**

Install ffmpeg and ensure it is on your PATH (verify with `ffmpeg -version`), or set the `FFMPEG_PATH` environment variable to the ffmpeg binary. Video playback works fine without ffmpeg — only thumbnails will be absent.

**Q: How do I access it from other devices on my network?**

The server binds to `0.0.0.0`, so any device on the same LAN can reach it at `http://<server-ip>:4007`. Consider assigning a static IP to the server machine on your router.

**Q: Can I expose it to the internet?**

Technically yes, but direct exposure is not recommended. Use a secure tunnel like VPN or Tailscale for remote access.

**Q: Some video formats won't play?**

It depends on your browser. `mp4 (H.264)` has the widest compatibility. `mkv` works in most modern browsers. iOS/Safari has known limitations with certain codecs.

---

## 🙏 Acknowledgements

This project was developed with the assistance of a coding agent ([opencode](https://github.com/anomalyco/opencode) + DeepSeek-V4-Pro).

---

## 📄 License

[MIT](LICENSE)
