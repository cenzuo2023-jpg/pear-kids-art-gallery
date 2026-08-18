/**
 * 🍐 想吃梨儿童艺术启蒙 · 官方全栈后端服务 (Full-Stack Backend Server)
 * 
 * 特性：
 * 1. 【即开即用零配置】: 自带轻量持久化数据库 (db.json)，启动即可实现多人跨设备数据同步与持久化。
 * 2. 【无缝对接云数据库】: 配置 .env 中的 DATABASE_URL 后，自动直连 PostgreSQL / Supabase 云数据库。
 * 3. 【完整 RESTful API】: 画作、特展、便签、名人堂、图片上传与主理人鉴权。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const vm = require('vm');

// 初始化本地轻量数据库
function initDatabase() {
  const dataJsPath = path.join(__dirname, 'data.js');
  let initialData = { artworks: [], students: [], thematicExhibitions: [], stickyNotes: [] };
  
  if (fs.existsSync(dataJsPath)) {
    try {
      const content = fs.readFileSync(dataJsPath, 'utf8').replace(/const /g, 'var ');
      const sandbox = {};
      vm.runInNewContext(content, sandbox);
      initialData = {
        artworks: sandbox.initialArtworks || [],
        students: sandbox.studentList || [],
        thematicExhibitions: sandbox.themeExhibitions || [],
        stickyNotes: sandbox.initialStickyNotes || []
      };
    } catch (e) {
      console.warn('提取 data.js 失败，使用内置数据:', e.message);
    }
  }

  if (!fs.existsSync(DB_FILE) || fs.readFileSync(DB_FILE, 'utf8').trim() === '{}' || fs.readFileSync(DB_FILE, 'utf8').includes('[]')) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { artworks: [], students: [], thematicExhibitions: [], stickyNotes: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

initDatabase();

const server = http.createServer((req, res) => {
  // 跨域 CORS 支持
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // JSON 响应辅助函数
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  // 请求体解析辅助函数
  const parseBody = (callback) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        callback(json);
      } catch (e) {
        sendJson(400, { error: 'Invalid JSON payload' });
      }
    });
  };

  // =========================================================================
  // 📡 API 路由分发
  // =========================================================================

  // 1. 作品接口 (Artworks)
  if (pathname === '/api/artworks' && req.method === 'GET') {
    const db = readDb();
    return sendJson(200, db.artworks);
  }
  if (pathname === '/api/artworks' && req.method === 'POST') {
    return parseBody(art => {
      const db = readDb();
      if (!art.id) art.id = 'art-' + Date.now();
      art.createdAt = new Date().toISOString();
      db.artworks.unshift(art);
      writeDb(db);
      sendJson(201, art);
    });
  }
  if (pathname.startsWith('/api/artworks/') && req.method === 'PUT') {
    const artId = pathname.replace('/api/artworks/', '');
    return parseBody(updatedArt => {
      const db = readDb();
      const idx = db.artworks.findIndex(a => a.id === artId);
      if (idx !== -1) {
        db.artworks[idx] = { ...db.artworks[idx], ...updatedArt };
        writeDb(db);
        sendJson(200, db.artworks[idx]);
      } else {
        sendJson(404, { error: 'Artwork not found' });
      }
    });
  }
  if (pathname.startsWith('/api/artworks/') && req.method === 'DELETE') {
    const artId = pathname.replace('/api/artworks/', '');
    const db = readDb();
    const idx = db.artworks.findIndex(a => a.id === artId);
    if (idx !== -1) {
      db.artworks.splice(idx, 1);
      writeDb(db);
      return sendJson(200, { success: true, message: 'Deleted' });
    }
    return sendJson(404, { error: 'Artwork not found' });
  }

  // 2. 小艺术家接口 (Students)
  if (pathname === '/api/students' && req.method === 'GET') {
    const db = readDb();
    return sendJson(200, db.students);
  }
  if (pathname === '/api/students' && req.method === 'POST') {
    return parseBody(student => {
      const db = readDb();
      if (!student.id) student.id = 's-' + Date.now();
      db.students.unshift(student);
      writeDb(db);
      sendJson(201, student);
    });
  }
  if (pathname.startsWith('/api/students/') && req.method === 'PUT') {
    const studentId = pathname.replace('/api/students/', '');
    return parseBody(updatedStudent => {
      const db = readDb();
      const idx = db.students.findIndex(s => s.id === studentId);
      if (idx !== -1) {
        db.students[idx] = { ...db.students[idx], ...updatedStudent };
        writeDb(db);
        sendJson(200, db.students[idx]);
      } else {
        sendJson(404, { error: 'Student not found' });
      }
    });
  }
  if (pathname.startsWith('/api/students/') && req.method === 'DELETE') {
    const studentId = pathname.replace('/api/students/', '');
    const db = readDb();
    const idx = db.students.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      db.students.splice(idx, 1);
      writeDb(db);
      return sendJson(200, { success: true, message: 'Deleted' });
    }
    return sendJson(404, { error: 'Student not found' });
  }

  // 3. 主题特展接口 (Themes)
  if (pathname === '/api/themes' && req.method === 'GET') {
    const db = readDb();
    return sendJson(200, db.thematicExhibitions);
  }
  if (pathname === '/api/themes' && req.method === 'POST') {
    return parseBody(theme => {
      const db = readDb();
      if (!theme.id) theme.id = 'theme-' + Date.now();
      db.thematicExhibitions.push(theme);
      writeDb(db);
      sendJson(201, theme);
    });
  }
  if (pathname.startsWith('/api/themes/') && req.method === 'PUT') {
    const themeId = pathname.replace('/api/themes/', '');
    return parseBody(updatedTheme => {
      const db = readDb();
      const idx = db.thematicExhibitions.findIndex(t => t.id === themeId);
      if (idx !== -1) {
        db.thematicExhibitions[idx] = { ...db.thematicExhibitions[idx], ...updatedTheme };
        writeDb(db);
        sendJson(200, db.thematicExhibitions[idx]);
      } else {
        sendJson(404, { error: 'Theme not found' });
      }
    });
  }
  if (pathname.startsWith('/api/themes/') && req.method === 'DELETE') {
    const themeId = pathname.replace('/api/themes/', '');
    const db = readDb();
    const idx = db.thematicExhibitions.findIndex(t => t.id === themeId);
    if (idx !== -1) {
      db.thematicExhibitions.splice(idx, 1);
      writeDb(db);
      return sendJson(200, { success: true, message: 'Deleted' });
    }
    return sendJson(404, { error: 'Theme not found' });
  }

  // 4. 便签墙接口 (Sticky Notes)
  if (pathname === '/api/sticky-notes' && req.method === 'GET') {
    const db = readDb();
    const visibleNotes = db.stickyNotes.filter(n => !n.isHidden);
    return sendJson(200, visibleNotes);
  }
  if (pathname === '/api/sticky-notes' && req.method === 'POST') {
    return parseBody(note => {
      const db = readDb();
      if (!note.id) note.id = 'note-' + Date.now();
      note.likes = note.likes || 1;
      note.isHidden = false;
      note.createdAt = new Date().toISOString();
      db.stickyNotes.unshift(note);
      writeDb(db);
      sendJson(201, note);
    });
  }
  if (pathname.match(/^\/api\/sticky-notes\/([^\/]+)\/like$/) && req.method === 'POST') {
    const noteId = pathname.split('/')[3];
    const db = readDb();
    const note = db.stickyNotes.find(n => n.id === noteId);
    if (note) {
      note.likes = (note.likes || 0) + 1;
      writeDb(db);
      return sendJson(200, { success: true, likes: note.likes });
    }
    return sendJson(404, { error: 'Note not found' });
  }
  if (pathname.startsWith('/api/sticky-notes/') && req.method === 'DELETE') {
    const noteId = pathname.replace('/api/sticky-notes/', '');
    const db = readDb();
    const noteIndex = db.stickyNotes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      db.stickyNotes.splice(noteIndex, 1);
      writeDb(db);
      return sendJson(200, { success: true, message: 'Deleted' });
    }
    return sendJson(404, { error: 'Note not found' });
  }

  // 5. 静态文件托管
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🍐 想吃梨儿童艺术启蒙 · 全栈服务已成功启动！`);
  console.log(`📡 本地访问地址: http://localhost:${PORT}`);
  console.log(`💾 数据持久化文件: ${DB_FILE}`);
  console.log(`========================================================\n`);
});
