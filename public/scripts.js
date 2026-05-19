(function () {
    "use strict";

    // ───────── DOM References ─────────
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const sidebar      = $("#sidebar");
    const overlay      = $("#overlay");
    const layout       = $("#layout");
    const videoList    = $("#videoList");
    const videoCount   = $("#videoCount");
    const searchInput  = $("#searchInput");
    const menuBtn      = $("#menuBtn");
    const videoPlayer  = $("#videoPlayer");
    const videoSource  = $("#videoSource");
    const videoWrapper = $("#videoWrapper");
    const bigPlayBtn   = $("#bigPlayBtn");
    const videoTitle   = $("#videoTitle");
    const videoDuration= $("#videoDuration");
    const progressBar  = $("#progressBar");
    const progressTrack= $("#progressTrack");
    const progressFill = $("#progressFill");
    const progressThumb= $("#progressThumb");
    const currentTimeEl= $("#currentTime");
    const totalTimeEl  = $("#totalTime");
    const toast        = $("#toast");

    const playPauseBtn = $("#playPauseBtn");
    const playIcon     = $("#playIcon");
    const pauseIcon    = $("#pauseIcon");
    const skipBackBtn  = $("#skipBackBtn");
    const skipFwdBtn   = $("#skipFwdBtn");
    const muteBtn      = $("#muteBtn");
    const volSlider    = $("#volSlider");
    const volIcon      = $("#volIcon");
    const volWave1     = $("#volWave1");
    const volWave2     = $("#volWave2");
    const speedSelect  = $("#speedSelect");
    const fullscreenBtn= $("#fullscreenBtn");
    const fsEnterIcon  = $("#fsEnterIcon");
    const fsExitIcon   = $("#fsExitIcon");
    const pipBtn       = $("#pipBtn");
    const extraControls= $("#extraControls");
    const viewToggle   = $("#viewToggle");
    const widescreenBtn= $("#widescreenBtn");
    const wsEnterIcon  = $("#wsEnterIcon");
    const wsExitIcon   = $("#wsExitIcon");
    const webFsBtn     = $("#webFsBtn");
    const webFsEnterIcon=$("#webFsEnterIcon");
    const webFsExitIcon=$("#webFsExitIcon");
    const pathSearchBtn = $("#pathSearchBtn");
    const wholeWordBtn  = $("#wholeWordBtn");
    const caseSensitiveBtn = $("#caseSensitiveBtn");

    const homeBtn       = $("#homeBtn");
    const homePage      = $("#homePage");
    const homeContent   = $("#homeContent");
    const homeCount     = $("#homeCount");
    const homeViewToggle= $("#homeViewToggle");
    const sortSelect    = $("#sortSelect");
    const folderTabs    = $("#folderTabs");

    // ───────── State ─────────
    let allVideos = [];
    let dirname   = "";
    let currentVideoIndex = -1;
    let isSeeking = false;
    let currentView = "list";
    let treeRoot = [];

    // ───────── Utility ─────────
    const fmtTime = (s) => {
        if (isNaN(s) || !isFinite(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return m + ":" + String(sec).padStart(2, "0");
    };

    const showToast = (msg, duration = 1800) => {
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove("show"), duration);
    };

    const isMobile = () => window.innerWidth <= 768;

    // ───────── Sidebar ─────────
    const openSidebar = () => {
        sidebar.classList.add("open");
        overlay.classList.add("show");
    };
    const closeSidebar = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    };
    const toggleSidebar = () => {
        if (isMobile()) {
            sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
        } else {
            sidebar.classList.toggle("collapsed");
        }
    };

    menuBtn.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", closeSidebar);

    // ───────── Drag-to-dismiss sidebar on mobile ─────────
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isDraggingSidebar = false;

    sidebar.addEventListener("touchstart", (e) => {
        if (!isMobile()) return;
        touchStartY = e.touches[0].clientY;
        isDraggingSidebar = true;
    }, { passive: true });

    sidebar.addEventListener("touchmove", (e) => {
        if (!isDraggingSidebar || !isMobile()) return;
        touchCurrentY = e.touches[0].clientY;
        const dy = touchCurrentY - touchStartY;
        if (dy > 0) {
            sidebar.style.transform = `translateY(${dy}px)`;
            sidebar.style.transition = "none";
        }
    }, { passive: true });

    sidebar.addEventListener("touchend", () => {
        if (!isMobile()) return;
        isDraggingSidebar = false;
        sidebar.style.transition = "";
        sidebar.style.transform = "";
        const dy = touchCurrentY - touchStartY;
        if (dy > 80) closeSidebar();
        touchStartY = 0;
        touchCurrentY = 0;
    });

    // Close sidebar on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("open")) {
            closeSidebar();
        }
    });

    // ───────── Fetch & Populate ─────────
    const fetchVideos = async () => {
        try {
            const resp = await fetch("/videos");
            const data = await resp.json();
            allVideos = data.videos || [];
            dirname   = data.dirname || "";
        } catch (err) {
            console.error("Failed to fetch videos:", err);
            allVideos = [];
            dirname   = "";
        }
    };

    const getRelPath = (absPath) => {
        // Normalize backslashes to forward slashes for URL
        let rel = absPath.replace(dirname, "").replace(/\\/g, "/");
        if (rel.startsWith("/")) rel = rel.slice(1);
        return rel;
    };

    const getFileName = (absPath) => {
        return absPath.split(/[\\/]/).pop() || absPath;
    };

    // ───────── Tree Builder ─────────
    const buildTree = () => {
        const root = [];
        allVideos.forEach((videoPath, idx) => {
            let rel = videoPath;
            if (rel.startsWith(dirname)) rel = rel.slice(dirname.length);
            rel = rel.replace(/\\/g, "/");
            if (rel.startsWith("/")) rel = rel.slice(1);
            const parts = rel.split("/");
            let siblings = root;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isFile = i === parts.length - 1;
                if (isFile) {
                    siblings.push({
                        name: part,
                        type: "file",
                        index: idx,
                        path: videoPath,
                        relPath: rel,
                    });
                } else {
                    let folder = siblings.find((c) => c.type === "folder" && c.name === part);
                    if (!folder) {
                        folder = { name: part, type: "folder", children: [], expanded: true, videoCount: 0 };
                        siblings.push(folder);
                    }
                    siblings = folder.children;
                }
            }
        });

        const countVids = (node) => {
            let n = 0;
            node.children.forEach((c) => {
                if (c.type === "folder") n += countVids(c);
                else n += 1;
            });
            node.videoCount = n;
            return n;
        };
        root.forEach((n) => { if (n.type === "folder") countVids(n); });
        treeRoot = root;
    };

    // ───────── Search State ─────────
    const searchState = {
        pathSearch: true,
        wholeWord: false,
        caseSensitive: false
    };

    const loadSearchState = () => {
        const saved = localStorage.getItem("vp_search");
        if (saved) {
            try {
                const s = JSON.parse(saved);
                searchState.pathSearch = s.pathSearch !== false;
                searchState.wholeWord = !!s.wholeWord;
                searchState.caseSensitive = !!s.caseSensitive;
            } catch (e) {}
        }
        pathSearchBtn.classList.toggle("active", searchState.pathSearch);
        wholeWordBtn.classList.toggle("active", searchState.wholeWord);
        caseSensitiveBtn.classList.toggle("active", searchState.caseSensitive);
    };

    const saveSearchState = () => {
        localStorage.setItem("vp_search", JSON.stringify(searchState));
    };

    const toggleSearchOption = (key, btn) => {
        searchState[key] = !searchState[key];
        btn.classList.toggle("active", searchState[key]);
        saveSearchState();
        renderCurrentView();
    };

    pathSearchBtn.addEventListener("click", () => toggleSearchOption("pathSearch", pathSearchBtn));
    wholeWordBtn.addEventListener("click", () => toggleSearchOption("wholeWord", wholeWordBtn));
    caseSensitiveBtn.addEventListener("click", () => toggleSearchOption("caseSensitive", caseSensitiveBtn));

    const matchesSearch = (videoPath, term) => {
        if (!term) return true;

        const searchText = searchState.pathSearch
            ? getRelPath(videoPath)
            : getFileName(videoPath);

        let src = searchText;
        let q = term;

        if (!searchState.caseSensitive) {
            src = src.toLowerCase();
            q = q.toLowerCase();
        }

        if (searchState.wholeWord) {
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp("(^|[\\\\/_.\\-\\s])" + escaped + "([\\\\/_.\\-\\s]|$)", searchState.caseSensitive ? "" : "i");
            return re.test(searchText);
        }

        return src.includes(q);
    };

    const renderVideoList = (filter = "") => {
        videoList.innerHTML = "";
        const term = filter.trim();

        const filtered = allVideos.filter((v) => {
            if (!term) return true;
            return matchesSearch(v, term);
        });

        videoCount.textContent = filtered.length === 1 ? "1 video" : filtered.length + " videos";

        if (filtered.length === 0) {
            const hint = document.createElement("div");
            hint.className = "empty-hint";
            hint.textContent = term
                ? `No videos matching "${term}"`
                : "No videos found. Place video files in the project directory.";
            videoList.appendChild(hint);
            return;
        }

        filtered.forEach((video) => {
            const origIdx = allVideos.indexOf(video);

            const item = document.createElement("div");
            item.className = "video-item";
            if (origIdx === currentVideoIndex) item.classList.add("active");
            item.dataset.index = origIdx;

            const fileName = getFileName(video);
            const folderPath = getFolderPath(video);

            item.innerHTML = `
                <svg class="item-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <div class="item-info">
                    <span class="item-name">${escapeHTML(fileName)}</span>
                    ${folderPath ? `<span class="item-meta">${escapeHTML(folderPath)}</span>` : ""}
                </div>
                <span class="item-index">#${origIdx + 1}</span>
            `;

            item.addEventListener("click", () => playVideo(origIdx));
            videoList.appendChild(item);
        });
    };

    const getFolderPath = (absPath) => {
        let rel = absPath;
        if (rel.startsWith(dirname)) rel = rel.slice(dirname.length);
        rel = rel.replace(/\\/g, "/");
        if (rel.startsWith("/")) rel = rel.slice(1);
        const parts = rel.split("/");
        if (parts.length <= 1) return "";
        return parts.slice(0, -1).join(" / ");
    };

    // ───────── Tree View Rendering ─────────
    const renderTreeNodes = (nodes, depth, container, term) => {
        nodes.forEach((node) => {
            if (node.type === "folder") {
                const hasMatch = nodeMatchesFilter(node, term);
                if (!hasMatch && term) return;
                const div = document.createElement("div");
                div.className = "tree-folder" + (node.expanded ? " expanded" : "");
                div.style.setProperty("--indent", depth);
                div.innerHTML = `
                    <div class="tree-folder-header">
                        <svg class="chevron" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                        <svg class="folder-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span class="folder-name">${escapeHTML(node.name)}</span>
                        <span class="folder-count">${node.videoCount}</span>
                    </div>
                    <div class="tree-children"></div>
                `;
                div.querySelector(".tree-folder-header").addEventListener("click", () => {
                    node.expanded = !node.expanded;
                    div.classList.toggle("expanded", node.expanded);
                });
                const childrenContainer = div.querySelector(".tree-children");
                renderTreeNodes(node.children, depth + 1, childrenContainer, term);
                container.appendChild(div);
            } else {
                if (term && !matchesFile(node, term)) return;
                const item = document.createElement("div");
                item.className = "tree-file";
                if (node.index === currentVideoIndex) item.classList.add("active");
                item.dataset.index = node.index;
                item.style.setProperty("--indent", depth);
                item.innerHTML = `
                    <svg class="item-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span class="item-name">${escapeHTML(node.name)}</span>
                    <span class="item-index">#${node.index + 1}</span>
                `;
                item.addEventListener("click", () => playVideo(node.index));
                container.appendChild(item);
            }
        });
    };

    const nodeMatchesFilter = (node, term) => {
        if (!term) return true;
        let found = false;
        const check = (n) => {
            if (n.type === "file" && matchesFile(n, term)) found = true;
            if (n.type === "folder") n.children.forEach(check);
        };
        check(node);
        return found;
    };

    const matchesFile = (fileNode, term) => {
        if (!term) return true;

        const searchText = searchState.pathSearch
            ? (fileNode.relPath || fileNode.name)
            : fileNode.name;

        let src = searchText;
        let q = term;

        if (!searchState.caseSensitive) {
            src = src.toLowerCase();
            q = q.toLowerCase();
        }

        if (searchState.wholeWord) {
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp("(^|[\\\\/_.\\-\\s])" + escaped + "([\\\\/_.\\-\\s]|$)", searchState.caseSensitive ? "" : "i");
            return re.test(searchText);
        }

        return src.includes(q);
    };

    const renderTreeView = (filter = "") => {
        videoList.innerHTML = "";
        const term = filter.trim();
        videoCount.textContent = allVideos.length === 1 ? "1 video" : allVideos.length + " videos";

        if (allVideos.length === 0) {
            const hint = document.createElement("div");
            hint.className = "empty-hint";
            hint.textContent = "No videos found. Place video files in the project directory.";
            videoList.appendChild(hint);
            return;
        }

        if (term) {
            expandMatchingFolders(treeRoot, term);
        }

        renderTreeNodes(treeRoot, 0, videoList, term);

        if (term && !videoList.children.length) {
            const hint = document.createElement("div");
            hint.className = "empty-hint";
            hint.textContent = `No videos matching "${filter}"`;
            videoList.appendChild(hint);
        }
    };

    const expandMatchingFolders = (nodes, term) => {
        nodes.forEach((node) => {
            if (node.type === "folder") {
                const has = nodeMatchesFilter(node, term);
                node.expanded = has;
                expandMatchingFolders(node.children, term);
            }
        });
    };

    const expandPathToIndex = (nodes, targetIdx) => {
        nodes.forEach((node) => {
            if (node.type === "folder") {
                const contains = folderContainsIndex(node, targetIdx);
                if (contains) {
                    node.expanded = true;
                    expandPathToIndex(node.children, targetIdx);
                }
            }
        });
    };

    const folderContainsIndex = (node, idx) => {
        let found = false;
        const check = (n) => {
            if (n.type === "file" && n.index === idx) found = true;
            if (n.type === "folder") n.children.forEach(check);
        };
        check(node);
        return found;
    };

    const renderCurrentView = () => {
        const term = searchInput.value;
        if (currentView === "tree") {
            renderTreeView(term);
        } else {
            renderVideoList(term);
        }
    };

    const escapeHTML = (str) => {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    };

    searchInput.addEventListener("input", () => {
        if (homePage.style.display === "flex") {
            renderHomePage();
        } else {
            renderCurrentView();
        }
    });

    // ───────── Homepage ─────────
    let homeViewMode = localStorage.getItem("vp_homeview") || "grid";
    let homeSort = localStorage.getItem("vp_homesort") || "name-asc";
    let homeFilterFolder = "";

    const getRecentVideos = () => {
        try { return JSON.parse(localStorage.getItem("vp_recent") || "[]"); }
        catch { return []; }
    };

    const addRecentVideo = (index) => {
        const recent = getRecentVideos().filter(i => i !== index);
        recent.unshift(index);
        localStorage.setItem("vp_recent", JSON.stringify(recent.slice(0, 20)));
    };

    const getCardGradient = (videoPath) => {
        const rel = getRelPath(videoPath);
        const parts = rel.split("/");
        const folder = parts.length > 1 ? parts[0] : "";
        let hash = 0;
        for (let i = 0; i < (folder || rel).length; i++) {
            hash = (folder || rel).charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `linear-gradient(135deg, hsl(${h},45%,22%), hsl(${(h+35)%360},40%,14%))`;
    };

    const escapeFilePath = (str) => {
        return str.replace(/\\/g, "/");
    };

    const getAllFolders = () => {
        const folders = new Set();
        allVideos.forEach(v => {
            const rel = getRelPath(v);
            const idx = rel.indexOf("/");
            if (idx > 0) folders.add(rel.substring(0, idx));
        });
        return [...folders].sort();
    };

    const getSortedVideos = () => {
        let list = allVideos.map((v, i) => ({ path: v, index: i }));

        const term = searchInput.value.trim();
        if (term) {
            list = list.filter(item => matchesSearch(item.path, term));
        }

        if (homeFilterFolder) {
            list = list.filter(item => {
                const rel = getRelPath(item.path);
                return rel.startsWith(homeFilterFolder + "/");
            });
        }

        if (homeSort === "recent") {
            const recent = getRecentVideos();
            list.sort((a, b) => {
                const ai = recent.indexOf(a.index);
                const bi = recent.indexOf(b.index);
                if (ai === -1 && bi === -1) return getFileName(a.path).localeCompare(getFileName(b.path));
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
            });
        } else if (homeSort === "name-desc") {
            list.sort((a, b) => getFileName(b.path).localeCompare(getFileName(a.path)));
        } else if (homeSort === "folder") {
            list.sort((a, b) => {
                const ra = getRelPath(a.path);
                const rb = getRelPath(b.path);
                return ra.localeCompare(rb);
            });
        } else {
            list.sort((a, b) => getFileName(a.path).localeCompare(getFileName(b.path)));
        }

        return list;
    };

    const renderFolderTabs = () => {
        const folders = getAllFolders();
        folderTabs.innerHTML = "";
        if (folders.length <= 1) return;

        const allBtn = document.createElement("button");
        allBtn.className = "folder-tab" + (homeFilterFolder === "" ? " active" : "");
        allBtn.textContent = "All";
        allBtn.addEventListener("click", () => {
            homeFilterFolder = "";
            renderHomePage();
        });
        folderTabs.appendChild(allBtn);

        folders.forEach(f => {
            const btn = document.createElement("button");
            btn.className = "folder-tab" + (homeFilterFolder === f ? " active" : "");
            btn.textContent = f;
            btn.addEventListener("click", () => {
                homeFilterFolder = f;
                renderHomePage();
            });
            folderTabs.appendChild(btn);
        });
    };

    const renderHomePage = () => {
        homeCount.textContent = allVideos.length === 1 ? "1 video" : allVideos.length + " videos";
        renderFolderTabs();

        switch (homeViewMode) {
            case "grid": renderHomeGrid(); break;
            case "list": renderHomeList(); break;
            case "card": renderHomeCard(); break;
            case "tree": renderHomeTree(); break;
        }
    };

    const renderHomeGrid = () => {
        homeContent.innerHTML = "";
        const list = getSortedVideos();

        if (list.length === 0) {
            homeContent.innerHTML = `<div class="home-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>${searchInput.value.trim() ? "No videos matching your search" : "No videos found"}</p></div>`;
            return;
        }

        const grid = document.createElement("div");
        grid.className = "home-grid";

        list.forEach(item => {
            const fileName = getFileName(item.path);
            const folderPath = getFolderPath(item.path);
            const grad = getCardGradient(item.path);

            const card = document.createElement("div");
            card.className = "home-grid-item";
            card.innerHTML = `
                <div class="home-grid-thumb">
                    <div class="home-grid-thumb-bg" style="background:${grad}">
                        <img class="home-grid-thumb-img" src="/thumb/${item.index}" onerror="this.style.display='none'" loading="lazy" alt="">
                        <svg viewBox="0 0 24 24" fill="white" width="36" height="36" opacity="0.4"><path d="M8 5v14l11-7z"/></svg>
                        <div class="play-overlay">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>
                <div class="home-grid-info">
                    <div class="home-grid-name">${escapeHTML(fileName)}</div>
                    ${folderPath ? `<div class="home-grid-meta">${escapeHTML(folderPath)}</div>` : ""}
                </div>
            `;
            card.addEventListener("click", () => playVideo(item.index));
            grid.appendChild(card);
        });

        homeContent.appendChild(grid);
    };

    const renderHomeList = () => {
        homeContent.innerHTML = "";
        const list = getSortedVideos();

        if (list.length === 0) {
            homeContent.innerHTML = `<div class="home-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>${searchInput.value.trim() ? "No videos matching your search" : "No videos found"}</p></div>`;
            return;
        }

        const table = document.createElement("table");
        table.className = "home-list";
        table.innerHTML = `
            <thead><tr>
                <th class="col-play"></th>
                <th class="col-thumb"></th>
                <th>Name</th>
                <th>Path</th>
                <th>#</th>
            </tr></thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector("tbody");

        list.forEach(item => {
            const fileName = getFileName(item.path);
            const folderPath = getFolderPath(item.path);
            const relPath = getRelPath(item.path);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="col-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></td>
                <td class="col-thumb"><img src="/thumb/${item.index}" onerror="this.style.display='none'" loading="lazy" alt=""></td>
                <td class="col-name">${escapeHTML(fileName)}</td>
                <td class="col-path">${escapeHTML(folderPath || relPath)}</td>
                <td class="col-idx">${item.index + 1}</td>
            `;
            tr.addEventListener("click", () => playVideo(item.index));
            tbody.appendChild(tr);
        });

        homeContent.appendChild(table);
    };

    const renderHomeCard = () => {
        homeContent.innerHTML = "";
        const list = getSortedVideos();

        if (list.length === 0) {
            homeContent.innerHTML = `<div class="home-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>${searchInput.value.trim() ? "No videos matching your search" : "No videos found"}</p></div>`;
            return;
        }

        const grid = document.createElement("div");
        grid.className = "home-card-grid";

        list.forEach(item => {
            const fileName = getFileName(item.path);
            const folderPath = getFolderPath(item.path);
            const grad = getCardGradient(item.path);

            const card = document.createElement("div");
            card.className = "home-card";
            card.innerHTML = `
                <div class="home-card-thumb">
                    <div class="home-card-thumb-bg" style="background:${grad}">
                        <img class="home-card-thumb-img" src="/thumb/${item.index}" onerror="this.style.display='none'" loading="lazy" alt="">
                        <svg viewBox="0 0 24 24" fill="white" width="40" height="40" opacity="0.35"><path d="M8 5v14l11-7z"/></svg>
                        <div class="play-overlay">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>
                <div class="home-card-info">
                    <div class="home-card-name">${escapeHTML(fileName)}</div>
                    <div class="home-card-meta">
                        ${folderPath ? `<span>${escapeHTML(folderPath)}</span>` : ""}
                    </div>
                    <span class="home-card-badge">#${item.index + 1}</span>
                </div>
            `;
            card.addEventListener("click", () => playVideo(item.index));
            grid.appendChild(card);
        });

        homeContent.appendChild(grid);
    };

    const renderHomeTree = () => {
        homeContent.innerHTML = "";
        if (allVideos.length === 0) {
            homeContent.innerHTML = `<div class="home-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No videos found</p></div>`;
            return;
        }

        const term = searchInput.value.trim();
        if (term) expandMatchingFolders(treeRoot, term);

        const container = document.createElement("div");
        container.className = "home-tree";
        renderTreeNodes(treeRoot, 0, container, term);

        if (term && !container.children.length) {
            homeContent.innerHTML = `<div class="home-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No videos matching "${term}"</p></div>`;
            return;
        }

        homeContent.appendChild(container);
    };

    homeBtn.addEventListener("click", () => {
        videoPlayer.pause();
        showHome();
    });

    sortSelect.addEventListener("change", () => {
        homeSort = sortSelect.value;
        localStorage.setItem("vp_homesort", homeSort);
        renderHomePage();
    });

    homeViewToggle.addEventListener("click", (e) => {
        const btn = e.target.closest(".home-view-btn");
        if (!btn) return;
        const view = btn.dataset.homeView;
        if (view === homeViewMode) return;
        homeViewMode = view;
        localStorage.setItem("vp_homeview", homeViewMode);
        $$(".home-view-btn").forEach(b => b.classList.toggle("active", b.dataset.homeView === view));
        renderHomePage();
    });

    const showHome = () => {
        layout.style.display = "none";
        homePage.style.display = "flex";
        document.body.classList.remove("fullscreen-active", "web-fs-active", "widescreen-active");
        isWebFS = false;
        isWidescreen = false;
        wsEnterIcon.style.display = "";
        wsExitIcon.style.display = "none";
        webFsEnterIcon.style.display = "";
        webFsExitIcon.style.display = "none";
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document).catch(() => {});
        }
        renderHomePage();
    };

    const showPlayer = () => {
        homePage.style.display = "none";
        layout.style.display = "flex";
    };

    // View toggle
    viewToggle.addEventListener("click", (e) => {
        const btn = e.target.closest(".view-btn");
        if (!btn) return;
        const view = btn.dataset.view;
        if (view === currentView) return;
        currentView = view;
        localStorage.setItem("vp_view", view);

        $$(".view-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
        renderCurrentView();
    });

    // ───────── Play ─────────
    const playVideo = (index) => {
        if (index < 0 || index >= allVideos.length) return;

        currentVideoIndex = index;
        const video = allVideos[index];
        const relPath = getRelPath(video);
        const fileName = getFileName(video);

        videoSource.src = relPath;
        videoSource.type = getMimeType(video);
        videoPlayer.load();
        videoPlayer.play().catch(() => {});

        videoTitle.textContent = "#" + (index + 1) + "  " + fileName;

        addRecentVideo(index);
        showPlayer();

        // Highlight active item in list view
        $$(".video-item").forEach((el) => {
            el.classList.toggle("active", Number(el.dataset.index) === index);
        });

        // Highlight + expand in tree view
        if (currentView === "tree") {
            expandPathToIndex(treeRoot, index);
            renderCurrentView();
        } else {
            // Scroll active item into view
            const activeItem = videoList.querySelector(".video-item.active");
            if (activeItem) activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        // Close sidebar on mobile after selection
        if (isMobile()) closeSidebar();
    };

    const getMimeType = (filePath) => {
        const ext = filePath.split(".").pop().toLowerCase();
        const map = {
            mp4: "video/mp4",
            mkv: "video/x-matroska",
            webm: "video/webm",
            avi: "video/x-msvideo",
            mov: "video/quicktime",
            flv: "video/x-flv",
            wmv: "video/x-ms-wmv",
            ogg: "video/ogg",
        };
        return map[ext] || "video/mp4";
    };

    // ========== PLAYER CONTROLS ==========

    // ── Play / Pause ──
    const updatePlayState = () => {
        const playing = !videoPlayer.paused;
        playIcon.style.display   = playing ? "none" : "";
        pauseIcon.style.display  = playing ? "" : "none";
        bigPlayBtn.classList.toggle("hidden", playing);
    };

    playPauseBtn.addEventListener("click", () => {
        if (videoPlayer.paused) {
            videoPlayer.play().catch(() => {});
        } else {
            videoPlayer.pause();
        }
    });

    bigPlayBtn.addEventListener("click", () => {
        videoPlayer.play().catch(() => {});
    });

    // ── Click video to toggle play ──
    videoWrapper.addEventListener("click", (e) => {
        if (e.target === videoWrapper || e.target === videoPlayer) {
            if (videoPlayer.paused) {
                videoPlayer.play().catch(() => {});
            } else {
                videoPlayer.pause();
            }
        }
    });

    videoPlayer.addEventListener("play", updatePlayState);
    videoPlayer.addEventListener("pause", updatePlayState);
    videoPlayer.addEventListener("ended", updatePlayState);

    // ── Duration / Metadata loaded ──
    videoPlayer.addEventListener("loadedmetadata", () => {
        totalTimeEl.textContent = fmtTime(videoPlayer.duration);
        videoDuration.textContent = fmtTime(videoPlayer.duration);
        updatePlayState();
    });

    // ── Time Update ──
    videoPlayer.addEventListener("timeupdate", () => {
        if (!isSeeking) {
            const pct = videoPlayer.duration ? (videoPlayer.currentTime / videoPlayer.duration) * 100 : 0;
            progressFill.style.width = pct + "%";
            progressThumb.style.left = pct + "%";
        }
        currentTimeEl.textContent = fmtTime(videoPlayer.currentTime);
    });

    // ── Progress Bar Seek ──
    const seekTo = (e) => {
        if (!videoPlayer.duration) return;
        const rect = progressTrack.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const pct = x / rect.width;
        videoPlayer.currentTime = pct * videoPlayer.duration;
    };

    progressTrack.addEventListener("mousedown", (e) => {
        isSeeking = true;
        progressBar.classList.add("seeking");
        seekTo(e);
    });

    document.addEventListener("mousemove", (e) => {
        if (!isSeeking) return;
        seekTo(e);
    });

    document.addEventListener("mouseup", () => {
        if (isSeeking) {
            isSeeking = false;
            progressBar.classList.remove("seeking");
        }
    });

    // Touch support for progress bar
    progressTrack.addEventListener("touchstart", (e) => {
        isSeeking = true;
        progressBar.classList.add("seeking");
        seekTo(e.touches[0]);
    }, { passive: false });

    progressTrack.addEventListener("touchmove", (e) => {
        if (isSeeking) seekTo(e.touches[0]);
    }, { passive: false });

    document.addEventListener("touchend", () => {
        if (isSeeking) {
            isSeeking = false;
            progressBar.classList.remove("seeking");
        }
    });

    // ── Volume ──
    const loadVolume = () => {
        const v = localStorage.getItem("vp_volume");
        if (v !== null) {
            videoPlayer.volume = parseFloat(v);
            volSlider.value = parseFloat(v) * 100;
        }
        videoPlayer.muted = videoPlayer.volume === 0;
        updateVolumeIcon();
    };

    const updateVolumeIcon = () => {
        const vol = videoPlayer.muted ? 0 : videoPlayer.volume;
        volSlider.value = vol * 100;

        if (videoPlayer.muted || vol === 0) {
            volWave1.style.display = "none";
            volWave2.style.display = "none";
        } else if (vol < 0.5) {
            volWave1.style.display = "none";
            volWave2.style.display = "";
        } else {
            volWave1.style.display = "";
            volWave2.style.display = "";
        }
    };

    volSlider.addEventListener("input", () => {
        const vol = parseFloat(volSlider.value) / 100;
        videoPlayer.volume = vol;
        videoPlayer.muted = (vol === 0);
        localStorage.setItem("vp_volume", vol);
        updateVolumeIcon();
    });

    muteBtn.addEventListener("click", () => {
        videoPlayer.muted = !videoPlayer.muted;
        updateVolumeIcon();
        showToast(videoPlayer.muted ? "Muted" : "Unmuted");
    });

    // ── Speed ──
    const loadSpeed = () => {
        const s = localStorage.getItem("vp_speed");
        if (s !== null) {
            speedSelect.value = s;
            videoPlayer.playbackRate = parseFloat(s);
        }
    };

    speedSelect.addEventListener("change", () => {
        const rate = parseFloat(speedSelect.value);
        videoPlayer.playbackRate = rate;
        localStorage.setItem("vp_speed", rate);
        showToast("Speed: " + speedSelect.options[speedSelect.selectedIndex].text);
    });

    // ── Skip Buttons ──
    const jumpTime = (seconds) => {
        if (!videoPlayer.duration) return;
        videoPlayer.currentTime = Math.max(0, Math.min(videoPlayer.currentTime + seconds, videoPlayer.duration));
    };

    skipBackBtn.addEventListener("click", () => jumpTime(isMobile() ? -15 : -10));
    skipFwdBtn.addEventListener("click", () => jumpTime(isMobile() ? 15 : 10));

    $("#bwd5minBtn").addEventListener("click", function() { jumpTime(parseInt(this.dataset.seconds)); });
    $("#bwd1minBtn").addEventListener("click", function() { jumpTime(parseInt(this.dataset.seconds)); });
    $("#bwd15sBtn").addEventListener("click", function() { jumpTime(parseInt(this.dataset.seconds)); });
    $("#fwd15sBtn").addEventListener("click", function() { jumpTime(parseInt(this.dataset.seconds)); });
    $("#fwd1minBtn").addEventListener("click", function() { jumpTime(parseInt(this.dataset.seconds)); });
    $("#fwd5minBtn").addEventListener("click", function() { jumpTime(parseInt(this.dataset.seconds)); });

    // ── Fullscreen ──
    const toggleFullscreen = () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    };

    fullscreenBtn.addEventListener("click", toggleFullscreen);

    const onFullscreenChange = () => {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsEnterIcon.style.display = isFS ? "none" : "";
        fsExitIcon.style.display  = isFS ? "" : "none";
        document.body.classList.toggle("fullscreen-active", isFS);
        if (isFS && isWebFS) {
            toggleWebFullscreen();
        }
        if (isFS) {
            tryLockOrientation();
        } else {
            tryUnlockOrientation();
        }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    // ── Widescreen ──
    let isWidescreen = false;

    const toggleWidescreen = () => {
        isWidescreen = !isWidescreen;
        wsEnterIcon.style.display = isWidescreen ? "none" : "";
        wsExitIcon.style.display  = isWidescreen ? "" : "none";
        document.body.classList.toggle("widescreen-active", isWidescreen);
        localStorage.setItem("vp_widescreen", isWidescreen ? "1" : "0");
    };

    widescreenBtn.addEventListener("click", toggleWidescreen);

    // ── Web Fullscreen ──
    let isWebFS = false;

    const toggleWebFullscreen = () => {
        isWebFS = !isWebFS;
        webFsEnterIcon.style.display = isWebFS ? "none" : "";
        webFsExitIcon.style.display  = isWebFS ? "" : "none";
        document.body.classList.toggle("web-fs-active", isWebFS);
        localStorage.setItem("vp_webfs", isWebFS ? "1" : "0");
    };

    webFsBtn.addEventListener("click", toggleWebFullscreen);

    // ── Mobile orientation lock ──
    const tryLockOrientation = () => {
        if (!screen.orientation || !screen.orientation.lock) return;
        try {
            if (videoPlayer.videoWidth > videoPlayer.videoHeight) {
                screen.orientation.lock("landscape").catch(() => {});
            }
        } catch (e) {}
    };

    const tryUnlockOrientation = () => {
        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch (e) {}
        }
    };

    // Double-click video wrapper for fullscreen
    videoWrapper.addEventListener("dblclick", (e) => {
        if (e.target === videoPlayer || e.target === videoWrapper || e.target === bigPlayBtn || e.target.closest("svg")) {
            toggleFullscreen();
        }
    });

    // ── PiP ──
    pipBtn.addEventListener("click", async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await videoPlayer.requestPictureInPicture();
            }
        } catch (err) {
            showToast("PiP not supported");
        }
    });

    // ── Mobile: swipe left/right on video ──
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeHandled = false;

    videoWrapper.addEventListener("touchstart", (e) => {
        if (e.target.closest(".big-play-btn")) return;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeHandled = false;
    }, { passive: true });

    videoWrapper.addEventListener("touchmove", (e) => {
        if (swipeHandled || !isMobile()) return;
        const dx = e.touches[0].clientX - swipeStartX;
        const dy = e.touches[0].clientY - swipeStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            swipeHandled = true;
            const s = isMobile() ? 15 : 10;
            jumpTime(dx > 0 ? s : -s);
            showToast((dx > 0 ? "+" : "-") + s + "s", 1000);
        }
    }, { passive: true });

    // ========== KEYBOARD SHORTCUTS ==========
    document.addEventListener("keydown", (e) => {
        // Ignore when typing in search
        if (document.activeElement === searchInput) return;

        switch (e.key) {
            case " ":
            case "k":
                e.preventDefault();
                playPauseBtn.click();
                break;
            case "ArrowLeft":
                e.preventDefault();
                jumpTime(e.shiftKey ? -60 : e.ctrlKey ? -5 : -10);
                showToast(e.shiftKey ? "-1min" : e.ctrlKey ? "-5s" : "-10s", 1000);
                break;
            case "ArrowRight":
                e.preventDefault();
                jumpTime(e.shiftKey ? 60 : e.ctrlKey ? 5 : 10);
                showToast(e.shiftKey ? "+1min" : e.ctrlKey ? "+5s" : "+10s", 1000);
                break;
            case "ArrowUp":
                e.preventDefault();
                videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.05);
                volSlider.value = videoPlayer.volume * 100;
                updateVolumeIcon();
                showToast("Vol: " + Math.round(videoPlayer.volume * 100) + "%", 1200);
                break;
            case "ArrowDown":
                e.preventDefault();
                videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.05);
                volSlider.value = videoPlayer.volume * 100;
                updateVolumeIcon();
                showToast("Vol: " + Math.round(videoPlayer.volume * 100) + "%", 1200);
                break;
            case "m":
                e.preventDefault();
                muteBtn.click();
                break;
            case "f":
                e.preventDefault();
                toggleFullscreen();
                break;
            case "w":
                e.preventDefault();
                toggleWidescreen();
                break;
            case "t":
                e.preventDefault();
                toggleSidebar();
                break;
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                e.preventDefault();
                const num = parseInt(e.key);
                if (num <= allVideos.length) {
                    playVideo(num - 1);
                }
                break;
        }
    });

    // ========== INIT ==========
    const init = async () => {
        await fetchVideos();

        // Load view preference
        const savedView = localStorage.getItem("vp_view");
        if (savedView === "tree" || savedView === "list") {
            currentView = savedView;
        }
        $$(".view-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === currentView));

        // Load search state
        loadSearchState();

        // Load widescreen
        if (localStorage.getItem("vp_widescreen") === "1") {
            isWidescreen = true;
            wsEnterIcon.style.display = "none";
            wsExitIcon.style.display = "";
            document.body.classList.add("widescreen-active");
        }

        // Load web fullscreen
        if (localStorage.getItem("vp_webfs") === "1") {
            isWebFS = true;
            webFsEnterIcon.style.display = "none";
            webFsExitIcon.style.display = "";
            document.body.classList.add("web-fs-active");
        }

        // Load home preferences
        homeViewMode = localStorage.getItem("vp_homeview") || "grid";
        homeSort = localStorage.getItem("vp_homesort") || "name-asc";
        sortSelect.value = homeSort;
        $$(".home-view-btn").forEach(b => b.classList.toggle("active", b.dataset.homeView === homeViewMode));

        if (allVideos.length > 0) {
            buildTree();
            renderCurrentView();
        } else {
            videoList.innerHTML = `<div class="empty-hint">No videos found.<br>Place video files in the project directory.</div>`;
            videoCount.textContent = "0 videos";
        }

        showHome();

        updateMobileLabels();
        loadVolume();
        loadSpeed();

        if (!localStorage.getItem("vp_volume")) {
            videoPlayer.volume = 0.5;
            volSlider.value = 50;
            updateVolumeIcon();
        }
    };

    init();

    // ── Responsive sidebar state sync ──
    const updateMobileLabels = () => {
        const ml = isMobile();
        const bl = skipBackBtn.querySelector(".btn-label");
        const fl = skipFwdBtn.querySelector(".btn-label");
        if (bl) { bl.textContent = ml ? "-15s" : "-10s"; }
        if (fl) { fl.textContent = ml ? "+15s" : "+10s"; }
        skipBackBtn.setAttribute("aria-label", ml ? "Skip back 15s" : "Skip back 10s");
        skipBackBtn.setAttribute("title", ml ? "-15s" : "-10s");
        skipFwdBtn.setAttribute("aria-label", ml ? "Skip forward 15s" : "Skip forward 10s");
        skipFwdBtn.setAttribute("title", ml ? "+15s" : "+10s");
    };

    window.addEventListener("resize", () => {
        updateMobileLabels();
        if (!isMobile() && sidebar.classList.contains("open")) {
            closeSidebar();
        }
    });

})();
