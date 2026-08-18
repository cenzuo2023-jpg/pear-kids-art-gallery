/**
 * 🍐 想吃梨儿童艺术启蒙 · 云端数据库与全栈数据服务层 (Cloud & API Service Layer)
 * 
 * 特性：
 * 1. 【模式 A·云原生直连】: 填入 Supabase URL 与 Anon Key，直连云端数据库。
 * 2. 【模式 B·Node.js REST API】: 连接自建 Node.js / Express API 服务器。
 * 3. 【无缝降级与本地持久化 (LocalStorage)】: 在离线或云端连接异常时，自动使用本地持久化缓存，保障 100% 可用且修改不丢失。
 * 4. 【双向字段命名归一化】: 自动转换 Supabase 下划线命名与前端驼峰命名。
 */

const CLOUD_CONFIG = {
  // 模式 A：Supabase 云数据库配置
  supabase: {
    enabled: true,
    url: "https://hnzddhxgzbkllnmwpvdi.supabase.co",
    anonKey: "sb_publishable_xHnY5J95z8B5pPLGMf2w9w_pLGfZXC9"
  },

  // 模式 B：自建 Node.js 后端服务器 API 地址
  apiServer: {
    enabled: true,
    baseUrl: "http://localhost:3000/api"
  }
};

class GalleryCloudService {
  constructor() {
    this.isCloudReady = false;
    this.storagePrefix = 'pear_gallery_';
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
        console.log("☁️ 已连接至 Supabase 云端数据库！");
      } catch (e) {
        console.warn("Supabase 初始化异常，降级至本地持久化模式:", e);
      }
    }
  }

  // --- 本地持久化辅助方法 (LocalStorage) ---
  _getLocal(key, defaultData) {
    try {
      const raw = localStorage.getItem(this.storagePrefix + key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultData;
  }

  _setLocal(key, data) {
    try {
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
    } catch (e) {
      console.warn("LocalStorage 写入超限或失败:", e);
    }
  }

  // --- 数据字段归一化 (兼容蛇形与驼峰命名) ---
  _normalizeArtwork(a) {
    if (!a) return a;
    return {
      id: a.id || 'art-' + Date.now(),
      title: a.title || '',
      author: a.author || '',
      age: a.age || '5岁',
      ageGroup: a.ageGroup || a.age_group || '3-5',
      category: a.category || 'oil-pastel',
      categoryName: a.categoryName || a.category_name || '少儿绘画',
      date: a.date || '2026.08',
      image: a.image || (Array.isArray(a.images) && a.images[0]) || '',
      images: Array.isArray(a.images) ? a.images : (a.image ? [a.image] : []),
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
      id: s.id || 's-' + Date.now(),
      name: s.name || '',
      age: s.age || '5岁',
      ageGroup: s.ageGroup || s.age_group || '3-5',
      className: s.className || s.class_name || '想吃梨启蒙学员班',
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
      id: t.id || 'theme-' + Date.now(),
      title: t.title || '',
      subTitle: t.subTitle || t.subtitle || '',
      tag: t.tag || '🌟 特别策划',
      season: t.season || '',
      date: t.date || '2026.08',
      coverImage: t.coverImage || t.cover_image || '',
      curator: t.curator || '想吃梨教研组',
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
      id: n.id || 'note-' + Date.now(),
      type: n.type || 'text',
      author: n.author || '',
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
  // 1. 作品接口 (Artworks CRUD)
  // =========================================================================
  async getArtworks() {
    const fallback = typeof initialArtworks !== 'undefined' ? initialArtworks : [];
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('artworks').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const list = data.map(a => this._normalizeArtwork(a));
          this._setLocal('artworks', list);
          return list;
        }
      } catch (e) {
        console.warn('Supabase 获取作品失败:', e);
      }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const list = data.map(a => this._normalizeArtwork(a));
            this._setLocal('artworks', list);
            return list;
          }
        }
      } catch (e) {}
    }
    return this._getLocal('artworks', fallback).map(a => this._normalizeArtwork(a));
  }

  async createArtwork(artData) {
    const normalized = this._normalizeArtwork(artData);
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('artworks').insert([this._toDbArtwork(normalized)]).select();
        if (!error && data && data[0]) return this._normalizeArtwork(data[0]);
      } catch (e) { console.warn('Supabase 录入画作失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
        if (res.ok) return this._normalizeArtwork(await res.json());
      } catch (e) {}
    }
    // 本地持久化更新
    const list = await this.getArtworks();
    list.unshift(normalized);
    this._setLocal('artworks', list);
    return normalized;
  }

  async updateArtwork(artData) {
    const normalized = this._normalizeArtwork(artData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('artworks').update(this._toDbArtwork(normalized)).eq('id', normalized.id);
      } catch (e) { console.warn('Supabase 更新画作失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
      } catch (e) {}
    }
    const list = await this.getArtworks();
    const idx = list.findIndex(a => a.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.unshift(normalized);
    this._setLocal('artworks', list);
    return normalized;
  }

  async deleteArtwork(artId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('artworks').delete().eq('id', artId);
      } catch (e) { console.warn('Supabase 删除画作失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/artworks/${artId}`, { method: 'DELETE' });
      } catch (e) {}
    }
    const list = await this.getArtworks();
    const filtered = list.filter(a => a.id !== artId);
    this._setLocal('artworks', filtered);
    return true;
  }

  // =========================================================================
  // 2. 小艺术家名人堂接口 (Students CRUD)
  // =========================================================================
  async getStudents() {
    const fallback = (typeof studentList !== 'undefined' ? studentList : (typeof initialStudents !== 'undefined' ? initialStudents : []));
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('students').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const list = data.map(s => this._normalizeStudent(s));
          this._setLocal('students', list);
          return list;
        }
      } catch (e) {
        console.warn('Supabase 获取小艺术家失败:', e);
      }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const list = data.map(s => this._normalizeStudent(s));
            this._setLocal('students', list);
            return list;
          }
        }
      } catch (e) {}
    }
    return this._getLocal('students', fallback).map(s => this._normalizeStudent(s));
  }

  async createStudent(studentData) {
    const normalized = this._normalizeStudent(studentData);
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('students').insert([this._toDbStudent(normalized)]).select();
        if (!error && data && data[0]) return this._normalizeStudent(data[0]);
      } catch (e) { console.warn('Supabase 新增小艺术家失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
        if (res.ok) return this._normalizeStudent(await res.json());
      } catch (e) {}
    }
    const list = await this.getStudents();
    list.unshift(normalized);
    this._setLocal('students', list);
    return normalized;
  }

  async updateStudent(studentData) {
    const normalized = this._normalizeStudent(studentData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('students').update(this._toDbStudent(normalized)).eq('id', normalized.id);
      } catch (e) { console.warn('Supabase 更新小艺术家失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
      } catch (e) {}
    }
    const list = await this.getStudents();
    const idx = list.findIndex(s => s.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.unshift(normalized);
    this._setLocal('students', list);
    return normalized;
  }

  async deleteStudent(studentId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('students').delete().eq('id', studentId);
      } catch (e) { console.warn('Supabase 删除小艺术家失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/students/${studentId}`, { method: 'DELETE' });
      } catch (e) {}
    }
    const list = await this.getStudents();
    const filtered = list.filter(s => s.id !== studentId);
    this._setLocal('students', filtered);
    return true;
  }

  // =========================================================================
  // 3. 主题特展接口 (Thematic Exhibitions CRUD)
  // =========================================================================
  async getThematicExhibitions() {
    const fallback = (typeof themeExhibitions !== 'undefined' ? themeExhibitions : (typeof initialThematicExhibitions !== 'undefined' ? initialThematicExhibitions : []));
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('thematic_exhibitions').select('*').order('hero_order', { ascending: true });
        if (!error && data && data.length > 0) {
          const list = data.map(t => this._normalizeTheme(t));
          this._setLocal('thematicExhibitions', list);
          return list;
        }
      } catch (e) {
        console.warn('Supabase 获取特展失败:', e);
      }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const list = data.map(t => this._normalizeTheme(t));
            this._setLocal('thematicExhibitions', list);
            return list;
          }
        }
      } catch (e) {}
    }
    return this._getLocal('thematicExhibitions', fallback).map(t => this._normalizeTheme(t));
  }

  async createThematicExhibition(themeData) {
    const normalized = this._normalizeTheme(themeData);
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('thematic_exhibitions').insert([this._toDbTheme(normalized)]).select();
        if (!error && data && data[0]) return this._normalizeTheme(data[0]);
      } catch (e) { console.warn('Supabase 新增特展失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
        if (res.ok) return this._normalizeTheme(await res.json());
      } catch (e) {}
    }
    const list = await this.getThematicExhibitions();
    list.push(normalized);
    this._setLocal('thematicExhibitions', list);
    return normalized;
  }

  async updateThematicExhibition(themeData) {
    const normalized = this._normalizeTheme(themeData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('thematic_exhibitions').upsert(this._toDbTheme(normalized));
      } catch (e) { console.warn('Supabase 更新特展失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes/${normalized.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
      } catch (e) {}
    }
    const list = await this.getThematicExhibitions();
    const idx = list.findIndex(t => t.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.push(normalized);
    this._setLocal('thematicExhibitions', list);
    return normalized;
  }

  async deleteThematicExhibition(themeId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('thematic_exhibitions').delete().eq('id', themeId);
      } catch (e) { console.warn('Supabase 删除特展失败:', e); }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/themes/${themeId}`, { method: 'DELETE' });
      } catch (e) {}
    }
    const list = await this.getThematicExhibitions();
    const filtered = list.filter(t => t.id !== themeId);
    this._setLocal('thematicExhibitions', filtered);
    return true;
  }

  // =========================================================================
  // 4. 便签墙留言接口 (Sticky Notes CRUD)
  // =========================================================================
  async getStickyNotes() {
    const fallback = typeof initialStickyNotes !== 'undefined' ? initialStickyNotes : [];
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient
          .from('sticky_notes')
          .select('*')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const list = data.map(n => this._normalizeNote(n));
          this._setLocal('stickyNotes', list);
          return list;
        }
      } catch (e) {
        console.warn('Supabase 获取便签失败:', e);
      }
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/sticky-notes`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const list = data.map(n => this._normalizeNote(n));
            this._setLocal('stickyNotes', list);
            return list;
          }
        }
      } catch (e) {}
    }
    return this._getLocal('stickyNotes', fallback).map(n => this._normalizeNote(n)).filter(n => !n.isHidden);
  }

  async createStickyNote(noteData) {
    const normalized = this._normalizeNote(noteData);
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient.from('sticky_notes').insert([{
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
        }]).select();
        if (!error && data && data[0]) return this._normalizeNote(data[0]);
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        const res = await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/sticky-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized)
        });
        if (res.ok) return this._normalizeNote(await res.json());
      } catch (e) {}
    }
    const list = await this.getStickyNotes();
    list.unshift(normalized);
    this._setLocal('stickyNotes', list);
    return normalized;
  }

  async likeStickyNote(noteId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.rpc('increment_sticky_likes', { note_id: noteId });
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/sticky-notes/${noteId}/like`, { method: 'POST' });
      } catch (e) {}
    }
    const list = await this.getStickyNotes();
    const note = list.find(n => n.id === noteId);
    if (note) {
      note.likes = (note.likes || 0) + 1;
      note.isLiked = true;
      this._setLocal('stickyNotes', list);
    }
  }

  async deleteStickyNote(noteId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('sticky_notes').update({ is_hidden: true }).eq('id', noteId);
      } catch (e) {}
    }
    if (CLOUD_CONFIG.apiServer.enabled) {
      try {
        await fetch(`${CLOUD_CONFIG.apiServer.baseUrl}/sticky-notes/${noteId}`, { method: 'DELETE' });
      } catch (e) {}
    }
    const list = await this.getStickyNotes();
    const filtered = list.filter(n => n.id !== noteId);
    this._setLocal('stickyNotes', filtered);
    return true;
  }
}

// 导出全局单例数据服务
window.galleryCloud = new GalleryCloudService();
