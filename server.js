const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawnSync, spawn } = require('child_process');
const app = express();

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm', '.ogg'];

const getVideos = (dir, fileList = []) => {
    let entries;
    try {
        entries = fs.readdirSync(dir);
    } catch {
        return fileList;
    }

    entries.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    entries.forEach(file => {
        const filePath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch {
            return;
        }
        if (stat.isDirectory()) {
            getVideos(filePath, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (VIDEO_EXTENSIONS.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
};

const getVideoMeta = (filePath) => {
    try {
        const stat = fs.statSync(filePath);
        return {
            name: path.basename(filePath),
            size: stat.size,
            sizeFormatted: formatSize(stat.size),
            mtime: stat.mtime.toISOString(),
        };
    } catch {
        return { name: path.basename(filePath), size: 0, sizeFormatted: '0 B', mtime: '' };
    }
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
};

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const THUMB_DIR = process.env.THUMB_DIR || path.join(__dirname, 'thumbnails');
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

const getThumbHash = (realPath) => crypto.createHash('md5').update(realPath).digest('hex');

const getThumbPath = (realPath) => path.join(THUMB_DIR, getThumbHash(realPath) + '.webp');

const generateThumb = (realPath) => {
    const thumbPath = getThumbPath(realPath);
    if (fs.existsSync(thumbPath)) return thumbPath;

    const tmpPath = thumbPath + '.tmp';
    try {
        const result = spawnSync(FFMPEG, [
            '-y', '-i', realPath,
            '-ss', '1', '-vframes', '1',
            '-q:v', '2', '-vf', 'scale=480:-1',
            '-f', 'webp', tmpPath
        ], { timeout: 15000, stdio: 'pipe' });
        if (result.status === 0 && fs.existsSync(tmpPath)) {
            fs.renameSync(tmpPath, thumbPath);
            return thumbPath;
        }
        const stderr = result.stderr.toString();
        if (result.error) {
            console.error(`[thumb] spawn error for "${path.basename(realPath)}":`, result.error.message);
        } else if (stderr.trim()) {
            console.error(`[thumb] ffmpeg exit ${result.status} for "${path.basename(realPath)}":`, stderr.slice(-200).trim());
        }
    } catch (e) {
        console.error(`[thumb] cannot run ffmpeg for "${path.basename(realPath)}":`, e.message);
    }
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    return null;
};

const bgGenOne = (realPath) => new Promise((resolve) => {
    const thumbPath = getThumbPath(realPath);
    if (fs.existsSync(thumbPath)) { resolve(); return; }
    const tmpPath = thumbPath + '.tmp';
    const proc = spawn(FFMPEG, [
        '-y', '-i', realPath,
        '-ss', '1', '-vframes', '1',
        '-q:v', '2', '-vf', 'scale=480:-1',
        '-f', 'webp', tmpPath
    ], { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(tmpPath)) {
            try { fs.renameSync(tmpPath, thumbPath); } catch (_) {}
            console.log(`[thumb] generated: ${path.basename(realPath)}`);
        } else {
            try { fs.unlinkSync(tmpPath); } catch (_) {}
            if (stderr.trim()) {
                console.error(`[thumb] bg-fail ${path.basename(realPath)}:`, stderr.slice(-200).trim());
            }
        }
        resolve();
    });
    proc.on('error', (e) => {
        console.error(`[thumb] bg-error ${path.basename(realPath)}:`, e.message);
        resolve();
    });
});

const startBgThumbGen = async () => {
    console.log(`Generating thumbnails in background for ${realPaths.length} videos...`);
    let count = 0;
    for (const rp of realPaths) {
        if (!fs.existsSync(getThumbPath(rp))) {
            await bgGenOne(rp);
            count++;
        }
    }
    if (count > 0) console.log(`Background thumbnail generation done (${count} new).`);
};

app.use(express.static(path.join(__dirname, 'public')));

const externalRaw = (process.env.VIDEO_PATHS || '').split(';').map(p => p.trim()).filter(p => p);
const externalDirs = [];
externalRaw.forEach(dir => {
    try {
        const st = fs.statSync(dir);
        if (st.isDirectory()) externalDirs.push(dir);
    } catch {}
});

const allVideos = [];
const realPaths = [];

const localVideos = getVideos(__dirname);
localVideos.forEach(v => {
    realPaths.push(v);
    allVideos.push('/' + path.relative(__dirname, v).replace(/\\/g, '/'));
});

externalDirs.forEach((dir, dirIdx) => {
    app.use('/v' + dirIdx, express.static(dir));
    const extVideos = getVideos(dir);
    extVideos.forEach(v => {
        realPaths.push(v);
        allVideos.push('/v' + dirIdx + '/' + path.relative(dir, v).replace(/\\/g, '/'));
    });
});

app.use(express.static(path.join(__dirname)));

const videos = allVideos;
const videosNormalized = videos.map(v => v.replace(/\\/g, '/'));
const thumbVersion = crypto.createHash('md5').update(realPaths.join('\n')).digest('hex');

app.get('/videos', (req, res) => {
    res.json({
        videos: videosNormalized,
        dirname: '',
        count: videosNormalized.length,
        thumbVersion,
    });
});

app.get('/videos/:index', (req, res) => {
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= videos.length) {
        return res.status(404).json({ error: 'Video not found' });
    }
    res.json({
        path: videosNormalized[idx],
        meta: getVideoMeta(realPaths[idx]),
        index: idx,
    });
});

app.get('/thumb/:index', (req, res) => {
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= realPaths.length) {
        return res.status(404).end();
    }
    const thumbPath = generateThumb(realPaths[idx]);
    if (!thumbPath) return res.status(404).end();
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(thumbPath).pipe(res);
});

const PORT = process.env.PORT || 4007;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`VideoPlayer server running at http://localhost:${PORT}`);
    console.log(`Found ${videos.length} video(s)`);
});
startBgThumbGen();

const shutdown = () => {
    console.log('\nShutting down...');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
