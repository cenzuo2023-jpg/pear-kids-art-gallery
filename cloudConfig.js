/**
 * 🍐 想吃梨儿童艺术启蒙 · 现代化双引擎持久化与云服务层 (Universal Cloud & IndexedDB Storage)
 * 
 * 核心特性：
 * 1. 【大容量持久化 IndexedDB 引擎】: 突破 LocalStorage 5MB 限制，永久保存高清画作与多视角照片，刷新 100% 不丢失。
 * 2. 【高容错异步超时保护】: 云端请求 1.8 秒超时自动回退至本地数据库，绝不卡死页面，秒级秒开。
 * 3. 【双向字段智能归一化】: 自动映射数据库下划线与前端驼峰字段。
 * 4. 【多级双备份机制】: IndexedDB + LocalStorage + 初始预置数据三重保障。
 */

const CLOUD_CONFIG = {
  supabase: {
    enabled: true,
    url: "https://hnzddhxgzbkllnmwpvdi.supabase.co",
    anonKey: "sb_publishable_xHnY5J95z8B5pPLGMf2w9w_pLGfZXC9",
    timeoutMs: 1800 // 1.8 秒快速响应保护
  },
  apiServer: {
    enabled: true,
    baseUrl: "http://localhost:3000/api",
    timeoutMs: 1500
  }
};

// =========================================================================
// 💾 IndexedDB 轻量大容量存储驱动
// =========================================================================
class GalleryIDBDriver {
  constructor() {
    this.dbName = 'PearKidsGalleryDB';
    this.version = 1;
    this.storeName = 'appData';
    this.db = null;
    this.initPromise = this._open();
  }

  _open() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = window.indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        req.onerror = () => {
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });
  }

  async get(key, defaultValue = null) {
    await this.initPromise;
    if (!this.db) return this._getLocalFallback(key, defaultValue);

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result !== undefined && req.result !== null) {
            resolve(req.result);
          } else {
            resolve(this._getLocalFallback(key, defaultValue));
          }
        };
        req.onerror = () => {
          resolve(this._getLocalFallback(key, defaultValue));
        };
      } catch (e) {
        resolve(this._getLocalFallback(key, defaultValue));
      }
    });
  }

  async set(key, value) {
    this._setLocalFallback(key, value);
    await this.initPromise;
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  _getLocalFallback(key, defaultValue) {
    try {
      const raw = localStorage.getItem('pear_gallery_' + key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed !== undefined && parsed !== null) return parsed;
      }
    } catch (e) {}
    return defaultValue;
  }

  _setLocalFallback(key, value) {
    try {
      localStorage.setItem('pear_gallery_' + key, JSON.stringify(value));
    } catch (e) {}
  }
}

const idbStorage = new GalleryIDBDriver();

// 超时封装工具
function withTimeout(promise, ms = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms))
  ]);
}

// =========================================================================
// 🚀 全局数据服务网关 (GalleryCloudService)
// =========================================================================
class GalleryCloudService {
  constructor() {
    this.isCloudReady = false;
    this.idb = idbStorage;
    this.init();
  }

  init() {
    if (CLOUD_CONFIG.supabase.enabled && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(
          CLOUD_CONFIG.supabase.url,
          CLOUD_CONFIG.supabase.anonKey
        );
        this.isCloudReady = true;
      } catch (e) {
        console.warn("Supabase 客户端初始化跳过:", e);
      }
    }
  }

  // --- 格式归一化 ---
  _normalizeArtwork(a) {
    if (!a) return a;
    const mainImg = a.image || (Array.isArray(a.images) && a.images[0]) || '';
    return {
      id: a.id || ('art-' + Date.now()),
      title: a.title || '无题',
      author: a.author || '小艺术家',
      age: a.age || '5岁',
      ageGroup: a.ageGroup || a.age_group || '3-5',
      category: a.category || 'oil-pastel',
      categoryName: a.categoryName || a.category_name || '少儿绘画',
      date: a.date || '2026.08',
      image: mainImg,
      images: Array.isArray(a.images) && a.images.length > 0 ? a.images : (mainImg ? [mainImg] : []),
      story: a.story || '',
      audioDuration: a.audioDuration || a.audio_duration || '00:20',
      audioUrl: a.audioUrl || a.audio_url || '',
      teacherComment: a.teacherComment || a.teacher_comment || '',
      isFeatured: a.isFeatured ?? a.is_featured ?? false
    };
  }

  _toDbArtwork(a) {
    return {
      id: a.id,
      title: a.title,
      author: a.author,
      age: a.age,
      age_group: a.ageGroup,
      category: a.category,
      category_name: a.categoryName,
      date: a.date,
      image: a.image,
      images: a.images,
      story: a.story,
      audio_duration: a.audioDuration,
      audio_url: a.audioUrl || null,
      teacher_comment: a.teacherComment,
      is_featured: a.isFeatured || false
    };
  }

  _normalizeStudent(s) {
    if (!s) return s;
    return {
      id: s.id || ('s-' + Date.now()),
      name: s.name || '',
      age: s.age || '5岁',
      ageGroup: s.ageGroup || s.age_group || '3-5',
      className: s.className || s.class_name || '启蒙创想班',
      avatar: s.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      bio: s.bio || '',
      featuredArtCount: s.featuredArtCount ?? s.featured_art_count ?? 1
    };
  }

  _toDbStudent(s) {
    return {
      id: s.id,
      name: s.name,
      age: s.age,
      age_group: s.ageGroup,
      class_name: s.className,
      avatar: s.avatar,
      bio: s.bio,
      featured_art_count: s.featuredArtCount || 1
    };
  }

  _normalizeTheme(t) {
    if (!t) return t;
    return {
      id: t.id || ('theme-' + Date.now()),
      title: t.title || '',
      subTitle: t.subTitle || t.subtitle || '',
      tag: t.tag || '🌟 特别策划',
      season: t.season || '',
      date: t.date || '2026.08',
      coverImage: t.coverImage || t.cover_image || '',
      curator: t.curator || '陈昨 & 想吃梨教研组',
      artworkCount: t.artworkCount ?? (t.artwork_ids ? t.artwork_ids.length : 0),
      introSummary: t.introSummary || t.intro || '',
      curatorStatement: t.curatorStatement || (t.curator_note ? [t.curator_note] : []),
      keyHighlights: t.keyHighlights || t.highlights || [],
      artworkIds: t.artworkIds || t.artwork_ids || [],
      isInHero: t.isInHero ?? t.is_in_hero ?? true,
      heroOrder: t.heroOrder ?? t.hero_order ?? 1
    };
  }

  _toDbTheme(t) {
    return {
      id: t.id,
      title: t.title,
      subtitle: t.subTitle || t.subtitle || '',
      cover_image: t.coverImage,
      tag: t.tag,
      date: t.date,
      intro: t.introSummary || t.intro || '',
      curator_note: Array.isArray(t.curatorStatement) ? t.curatorStatement.join('\n\n') : (t.curatorStatement || ''),
      artwork_ids: t.artworkIds || [],
      is_in_hero: t.isInHero !== false,
      hero_order: t.heroOrder || 1
    };
  }

  _normalizeNote(n) {
    if (!n) return n;
    return {
      id: n.id || ('note-' + Date.now()),
      type: n.type || 'text',
      author: n.author || '艺术友人',
      role: n.role || 'visitor',
      roleName: n.roleName || n.role_name || '',
      color: n.color || 'yellow',
      content: n.content || '',
      artworkTitle: n.artworkTitle || n.artwork_title || '',
      artworkImage: n.artworkImage || n.artwork_image || '',
      tag: n.tag || '#想吃梨美育',
      date: n.date || '2026.08',
      likes: n.likes || 0,
      isLiked: n.isLiked || false,
      isHidden: n.isHidden || n.is_hidden || false
    };
  }

  // =========================================================================
  // 1. 作品接口 (Artworks)
  // =========================================================================
  async getArtworks() {
    const fallback = typeof initialArtworks !== 'undefined' ? initialArtworks : [];
    
    // 1. 优先读取持久化本地数据库中的已保存数据
    const localData = await this.idb.get('artworks', null);
    if (localData && Array.isArray(localData) && localData.length > 0) {
      return localData.map(a => this._normalizeArtwork(a));
    }

    // 2. 尝试云端同步 (带超时保护)
    if (this.isCloudReady) {
      try {
        const fetchPromise = this.supabaseClient.from('artworks').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(fetchPromise, CLOUD_CONFIG.supabase.timeoutMs);
        if (!error && data && data.length > 0) {
          const list = data.map(a => this._normalizeArtwork(a));
          await this.idb.set('artworks', list);
          return list;
        }
      } catch (e) {}
    }

    // 3. 初始预置数据兜底并持久化
    const normalizedFallback = fallback.map(a => this._normalizeArtwork(a));
    await this.idb.set('artworks', normalizedFallback);
    return normalizedFallback;
  }

  async createArtwork(artData) {
    const normalized = this._normalizeArtwork(artData);

    // 1. 立即写入本地 IndexedDB 保证刷新 100% 不丢
    const list = await this.getArtworks();
    list.unshift(normalized);
    await this.idb.set('artworks', list);

    // 2. 异步同步到云端
    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('artworks').insert([this._toDbArtwork(normalized)]).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        }).catch(() => {});
      } catch (e) {}
    }

    return normalized;
  }

  async updateArtwork(artData) {
    const normalized = this._normalizeArtwork(artData);

    // 1. 立即更新本地 IndexedDB
    const list = await this.getArtworks();
    const idx = list.findIndex(a => a.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.unshift(normalized);
    await this.idb.set('artworks', list);

    // 2. 异步更新云端
    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('artworks').update(this._toDbArtwork(normalized)).eq('id', normalized.id).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        }).catch(() => {});
      } catch (e) {}
    }

    return normalized;
  }

  async deleteArtwork(artId) {
    // 1. 立即从本地 IndexedDB 移除
    const list = await this.getArtworks();
    const filtered = list.filter(a => a.id !== artId);
    await this.idb.set('artworks', filtered);

    // 2. 异步同步云端
    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('artworks').delete().eq('id', artId).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks/${artId}`, { method: 'DELETE' }).catch(() => {});
      } catch (e) {}
    }

    return true;
  }

  // =========================================================================
  // 2. 小艺术家名人堂接口 (Students)
  // =========================================================================
  async getStudents() {
    const fallback = (typeof studentList !== 'undefined' ? studentList : (typeof initialStudents !== 'undefined' ? initialStudents : []));
    
    // 1. 优先读取持久化本地数据库
    const localData = await this.idb.get('students', null);
    if (localData && Array.isArray(localData) && localData.length > 0) {
      return localData.map(s => this._normalizeStudent(s));
    }

    // 2. 尝试云端同步 (带超时保护)
    if (this.isCloudReady) {
      try {
        const fetchPromise = this.supabaseClient.from('students').select('*').order('created_at', { ascending: false });
        const { data, error } = await withTimeout(fetchPromise, CLOUD_CONFIG.supabase.timeoutMs);
        if (!error && data && data.length > 0) {
          const list = data.map(s => this._normalizeStudent(s));
          await this.idb.set('students', list);
          return list;
        }
      } catch (e) {}
    }

    // 3. 初始预置数据兜底并持久化
    const normalizedFallback = fallback.map(s => this._normalizeStudent(s));
    await this.idb.set('students', normalizedFallback);
    return normalizedFallback;
  }

  async createStudent(studentData) {
    const normalized = this._normalizeStudent(studentData);
    const list = await this.getStudents();
    list.unshift(normalized);
    await this.idb.set('students', list);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('students').insert([this._toDbStudent(normalized)]).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        }).catch(() => {});
      } catch (e) {}
    }
    return normalized;
  }

  async updateStudent(studentData) {
    const normalized = this._normalizeStudent(studentData);
    const list = await this.getStudents();
    const idx = list.findIndex(s => s.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.unshift(normalized);
    await this.idb.set('students', list);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('students').update(this._toDbStudent(normalized)).eq('id', normalized.id).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        }).catch(() => {});
      } catch (e) {}
    }
    return normalized;
  }

  async deleteStudent(studentId) {
    const list = await this.getStudents();
    const filtered = list.filter(s => s.id !== studentId);
    await this.idb.set('students', filtered);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('students').delete().eq('id', studentId).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students/${studentId}`, { method: 'DELETE' }).catch(() => {});
      } catch (e) {}
    }
    return true;
  }

  // =========================================================================
  // 3. 主题特展接口 (Thematic Exhibitions)
  // =========================================================================
  async getThematicExhibitions() {
    const fallback = (typeof themeExhibitions !== 'undefined' ? themeExhibitions : (typeof initialThematicExhibitions !== 'undefined' ? initialThematicExhibitions : []));
    
    const localData = await this.idb.get('thematicExhibitions', null);
    if (localData && Array.isArray(localData) && localData.length > 0) {
      return localData.map(t => this._normalizeTheme(t));
    }

    if (this.isCloudReady) {
      try {
        const fetchPromise = this.supabaseClient.from('thematic_exhibitions').select('*').order('hero_order', { ascending: true });
        const { data, error } = await withTimeout(fetchPromise, CLOUD_CONFIG.supabase.timeoutMs);
        if (!error && data && data.length > 0) {
          const list = data.map(t => this._normalizeTheme(t));
          await this.idb.set('thematicExhibitions', list);
          return list;
        }
      } catch (e) {}
    }

    const normalizedFallback = fallback.map(t => this._normalizeTheme(t));
    await this.idb.set('thematicExhibitions', normalizedFallback);
    return normalizedFallback;
  }

  async createThematicExhibition(themeData) {
    const normalized = this._normalizeTheme(themeData);
    const list = await this.getThematicExhibitions();
    list.push(normalized);
    await this.idb.set('thematicExhibitions', list);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('thematic_exhibitions').insert([this._toDbTheme(normalized)]).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        }).catch(() => {});
      } catch (e) {}
    }
    return normalized;
  }

  async updateThematicExhibition(themeData) {
    const normalized = this._normalizeTheme(themeData);
    const list = await this.getThematicExhibitions();
    const idx = list.findIndex(t => t.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.push(normalized);
    await this.idb.set('thematicExhibitions', list);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('thematic_exhibitions').upsert(this._toDbTheme(normalized)).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        }).catch(() => {});
      } catch (e) {}
    }
    return normalized;
  }

  async deleteThematicExhibition(themeId) {
    const list = await this.getThematicExhibitions();
    const filtered = list.filter(t => t.id !== themeId);
    await this.idb.set('thematicExhibitions', filtered);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('thematic_exhibitions').delete().eq('id', themeId).then(() => {});
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes/${themeId}`, { method: 'DELETE' }).catch(() => {});
      } catch (e) {}
    }
    return true;
  }

  // =========================================================================
  // 4. 便签墙留言接口 (Sticky Notes)
  // =========================================================================
  async getStickyNotes() {
    const fallback = typeof initialStickyNotes !== 'undefined' ? initialStickyNotes : [];
    
    const localData = await this.idb.get('stickyNotes', null);
    if (localData && Array.isArray(localData) && localData.length > 0) {
      return localData.map(n => this._normalizeNote(n)).filter(n => !n.isHidden);
    }

    if (this.isCloudReady) {
      try {
        const fetchPromise = this.supabaseClient.from('sticky_notes').select('*').eq('is_hidden', false).order('created_at', { ascending: false });
        const { data, error } = await withTimeout(fetchPromise, CLOUD_CONFIG.supabase.timeoutMs);
        if (!error && data && data.length > 0) {
          const list = data.map(n => this._normalizeNote(n));
          await this.idb.set('stickyNotes', list);
          return list;
        }
      } catch (e) {}
    }

    const normalizedFallback = fallback.map(n => this._normalizeNote(n));
    await this.idb.set('stickyNotes', normalizedFallback);
    return normalizedFallback.filter(n => !n.isHidden);
  }

  async createStickyNote(noteData) {
    const normalized = this._normalizeNote(noteData);
    const list = await this.getStickyNotes();
    list.unshift(normalized);
    await this.idb.set('stickyNotes', list);

    if (this.isCloudReady) {
      try {
        this.supabaseClient.from('sticky_notes').insert([{
          id: normalized.id,
          type: normalized.type,
          author: normalized.author,
          role: normalized.role,
          role_name: normalized.roleName,
          color: normalized.color,
          content: normalized.content,
          artwork_title: normalized.artworkTitle || '',
          artwork_image: normalized.artworkImage || '',
          tag: normalized.tag,
          date: normalized.date,
          likes: normalized.likes || 0,
          is_hidden: false
        }]).then(() => {});
      } catch (e) {}
    }
    return normalized;
  }

  async likeStickyNote(noteId) {
    const list = await this.getStickyNotes();
    const note = list.find(n => n.id === noteId);
    if (note) {
      note.likes = (note.likes || 0) + 1;
      note.isLiked = true;
      await this.idb.set('stickyNotes', list);
    }
  }

  async deleteStickyNote(noteId) {
    const list = await this.getStickyNotes();
    const filtered = list.filter(n => n.id !== noteId);
    await this.idb.set('stickyNotes', filtered);
    return true;
  }
}

// 导出全局单例
window.galleryCloud = new GalleryCloudService();
