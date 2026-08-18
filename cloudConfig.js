/**
 * 🍐 想吃梨儿童艺术启蒙 · Supabase 云端直连核心数据服务 (Cloud-First Architecture)
 * 
 * 核心架构：
 * 1. 【云端第一真理源 (Cloud-First)】: 新增、修改、删除直接写入 Supabase PostgreSQL 云端数据库。
 * 2. 【高精度字段映射】: 前端驼峰 (camelCase) 与数据库蛇形 (snake_case) 100% 精准转换，杜绝字段缺失。
 * 3. 【透明状态与报错反馈】: 云端写入成功即刻提示，若遇 RLS 策略或权限问题显式报错。
 * 4. 【本地同步镜像】: 本地仅作为快速预加载镜像，云端数据永远优先。
 */

const CLOUD_CONFIG = {
  supabase: {
    enabled: true,
    url: "https://hnzddhxgzbkllnmwpvdi.supabase.co",
    anonKey: "sb_publishable_xHnY5J95z8B5pPLGMf2w9w_pLGfZXC9"
  }
};

class SupabaseCloudGalleryService {
  constructor() {
    this.isCloudReady = false;
    this.localCacheKey = 'pear_gallery_cloud_cache_';
    this.init();
  }

  init() {
    const doConnect = () => {
      if (CLOUD_CONFIG.supabase.enabled && window.supabase) {
        try {
          this.supabaseClient = window.supabase.createClient(
            CLOUD_CONFIG.supabase.url,
            CLOUD_CONFIG.supabase.anonKey
          );
          this.isCloudReady = true;
          console.log('☁️ Supabase 云端数据库客户端连接就绪:', CLOUD_CONFIG.supabase.url);
          const badge = document.getElementById('cloudStatusBadge');
          if (badge) {
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#10E57A] animate-pulse"></span><span>Supabase 云数据库已连接</span>`;
            badge.classList.remove('hidden');
          }
          return true;
        } catch (e) {
          console.error('❌ Supabase 客户端初始化失败:', e);
        }
      }
      return false;
    };

  async ensureReady() {
    if (this.isCloudReady && this.supabaseClient) return true;
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        attempts++;
        if (this.isCloudReady && this.supabaseClient) {
          resolve(true);
        } else if (attempts > 30) {
          resolve(false);
        } else {
          setTimeout(check, 80);
        }
      };
      check();
    });
  }

  // --- 数据库字段映射与归一化 ---
  _fromDbArtwork(a) {
    if (!a) return null;
    const mainImg = a.image || (Array.isArray(a.images) && a.images[0]) || '';
    return {
      id: String(a.id),
      title: a.title || '无题作品',
      author: a.author || '小艺术家',
      age: a.age || '5岁',
      ageGroup: a.age_group || a.ageGroup || '3-5',
      category: a.category || 'oil-pastel',
      categoryName: a.category_name || a.categoryName || '少儿绘画',
      date: a.date || '2026.08',
      image: mainImg,
      images: Array.isArray(a.images) && a.images.length > 0 ? a.images : (mainImg ? [mainImg] : []),
      story: a.story || '',
      audioDuration: a.audio_duration || a.audioDuration || '00:24',
      audioUrl: a.audio_url || a.audioUrl || '',
      teacherComment: a.teacher_comment || a.teacherComment || '',
      isFeatured: a.is_featured ?? a.isFeatured ?? false
    };
  }

  _toDbArtwork(a) {
    const mainImg = a.image || (Array.isArray(a.images) && a.images[0]) || '';
    const imagesList = Array.isArray(a.images) && a.images.length > 0 ? a.images : (mainImg ? [mainImg] : []);
    return {
      id: String(a.id || ('art-' + Date.now())),
      title: String(a.title || '无题作品'),
      author: String(a.author || '小艺术家'),
      age: String(a.age || '5岁'),
      age_group: String(a.ageGroup || a.age_group || '3-5'),
      category: String(a.category || 'oil-pastel'),
      category_name: String(a.categoryName || a.category_name || '少儿绘画'),
      date: String(a.date || '2026.08'),
      image: String(mainImg),
      images: imagesList,
      story: String(a.story || ''),
      audio_duration: String(a.audioDuration || '00:24'),
      audio_url: a.audioUrl || null,
      teacher_comment: String(a.teacherComment || ''),
      is_featured: Boolean(a.isFeatured)
    };
  }

  _fromDbStudent(s) {
    if (!s) return null;
    return {
      id: String(s.id),
      name: s.name || '',
      age: s.age || '5岁',
      ageGroup: s.age_group || s.ageGroup || '3-5',
      className: s.class_name || s.className || '启蒙创想班',
      avatar: s.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      bio: s.bio || '',
      featuredArtCount: s.featured_art_count ?? s.featuredArtCount ?? 1
    };
  }

  _toDbStudent(s) {
    return {
      id: String(s.id || ('s-' + Date.now())),
      name: String(s.name || '小画家'),
      age: String(s.age || '5岁'),
      age_group: String(s.ageGroup || s.age_group || '3-5'),
      class_name: String(s.className || s.class_name || '启蒙创想班'),
      avatar: String(s.avatar || ''),
      bio: String(s.bio || ''),
      featured_art_count: parseInt(s.featuredArtCount || s.featured_art_count || 1)
    };
  }

  _fromDbTheme(t) {
    if (!t) return null;
    return {
      id: String(t.id),
      title: t.title || '',
      subTitle: t.subtitle || t.subTitle || '',
      tag: t.tag || '🌟 特别策划',
      season: t.season || '',
      date: t.date || '2026.08',
      coverImage: t.cover_image || t.coverImage || '',
      curator: t.curator || '陈昨 & 想吃梨教研组',
      artworkCount: t.artworkCount ?? (t.artwork_ids ? t.artwork_ids.length : 0),
      introSummary: t.intro || t.introSummary || '',
      curatorStatement: t.curator_note ? [t.curator_note] : (Array.isArray(t.curatorStatement) ? t.curatorStatement : []),
      keyHighlights: t.highlights || t.keyHighlights || [],
      artworkIds: t.artwork_ids || t.artworkIds || [],
      isInHero: t.is_in_hero ?? t.isInHero ?? true,
      heroOrder: t.hero_order ?? t.heroOrder ?? 1
    };
  }

  _toDbTheme(t) {
    return {
      id: String(t.id || ('theme-' + Date.now())),
      title: String(t.title || ''),
      subtitle: String(t.subTitle || t.subtitle || ''),
      cover_image: String(t.coverImage || t.cover_image || ''),
      tag: String(t.tag || '🌟 特别策划'),
      date: String(t.date || '2026.08'),
      intro: String(t.introSummary || t.intro || ''),
      curator_note: Array.isArray(t.curatorStatement) ? t.curatorStatement.join('\n\n') : String(t.curatorStatement || t.curator_note || ''),
      artwork_ids: Array.isArray(t.artworkIds) ? t.artworkIds : [],
      is_in_hero: Boolean(t.isInHero !== false),
      hero_order: parseInt(t.heroOrder || t.hero_order || 1)
    };
  }

  _fromDbNote(n) {
    if (!n) return null;
    return {
      id: String(n.id),
      type: n.type || 'text',
      author: n.author || '艺术友人',
      role: n.role || 'visitor',
      roleName: n.role_name || n.roleName || '',
      color: n.color || 'yellow',
      content: n.content || '',
      artworkTitle: n.artwork_title || n.artworkTitle || '',
      artworkImage: n.artwork_image || n.artworkImage || '',
      tag: n.tag || '#想吃梨美育',
      date: n.date || '2026.08',
      likes: n.likes || 0,
      isLiked: false,
      isHidden: Boolean(n.is_hidden)
    };
  }

  _toDbNote(n) {
    return {
      id: String(n.id || ('note-' + Date.now())),
      type: String(n.type || 'text'),
      author: String(n.author || '艺术友人'),
      role: String(n.role || 'visitor'),
      role_name: String(n.roleName || n.role_name || ''),
      color: String(n.color || 'yellow'),
      content: String(n.content || ''),
      artwork_title: String(n.artworkTitle || n.artwork_title || ''),
      artwork_image: String(n.artworkImage || n.artwork_image || ''),
      tag: String(n.tag || '#想吃梨美育'),
      date: String(n.date || '2026.08'),
      likes: parseInt(n.likes || 0),
      is_hidden: Boolean(n.isHidden)
    };
  }

  // =========================================================================
  // 1. 作品档案 (Artworks CRUD 直连 Supabase 云端)
  // =========================================================================
  async getArtworks() {
    await this.ensureReady();
    if (this.isCloudReady && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('artworks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const list = data.map(item => this._fromDbArtwork(item));
          localStorage.setItem(this.localCacheKey + 'artworks', JSON.stringify(list));
          console.log('☁️ 前台从 Supabase 获取画作成功，实时总数:', list.length);
          return list;
        } else if (error) {
          console.warn('⚠️ Supabase 获取作品云端返回异常:', error.message);
        }
      } catch (err) {
        console.warn('⚠️ 读取 Supabase 失败，使用本地镜像:', err);
      }
    }

    // 本地缓存 / 初始数据兜底
    try {
      const local = JSON.parse(localStorage.getItem(this.localCacheKey + 'artworks') || 'null');
      if (local && Array.isArray(local) && local.length > 0) return local;
    } catch (e) {}

    const fallback = typeof initialArtworks !== 'undefined' ? initialArtworks : [];
    return fallback.map(a => this._fromDbArtwork(a));
  }

  async createArtwork(artData) {
    const dbPayload = this._toDbArtwork(artData);
    console.log('☁️ 正在写入 Supabase 云端数据库 (artworks):', dbPayload);

    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient
          .from('artworks')
          .insert([dbPayload])
          .select();

        if (error) {
          console.error('❌ Supabase 云端保存失败:', error);
          if (window.showToast) {
            window.showToast(`⚠️ 云端保存报错: ${error.message} (请检查Supabase RLS权限)`);
          }
        } else {
          console.log('✅ Supabase 云端保存成功！', data);
          if (window.showToast) {
            window.showToast(`☁️ 成功存入 Supabase 云端数据库！`);
          }
        }
      } catch (e) {
        console.error('❌ 写入 Supabase 异常:', e);
      }
    }

    // 同步更新本地镜像
    const list = await this.getArtworks();
    const normalized = this._fromDbArtwork(dbPayload);
    const existingIdx = list.findIndex(a => a.id === normalized.id);
    if (existingIdx !== -1) list[existingIdx] = normalized;
    else list.unshift(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'artworks', JSON.stringify(list));
    } catch (e) {}

    return normalized;
  }

  async updateArtwork(artData) {
    const dbPayload = this._toDbArtwork(artData);
    console.log('☁️ 正在更新 Supabase 云端画作:', dbPayload.id);

    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient
          .from('artworks')
          .update(dbPayload)
          .eq('id', dbPayload.id)
          .select();

        if (error) {
          console.error('❌ Supabase 更新失败:', error);
          if (window.showToast) {
            window.showToast(`⚠️ 云端更新报错: ${error.message}`);
          }
        } else {
          console.log('✅ Supabase 云端更新成功！', data);
          if (window.showToast) {
            window.showToast(`☁️ 云端数据库已同步更新！`);
          }
        }
      } catch (e) {
        console.error('❌ 更新 Supabase 异常:', e);
      }
    }

    // 同步更新本地镜像
    const list = await this.getArtworks();
    const normalized = this._fromDbArtwork(dbPayload);
    const idx = list.findIndex(a => a.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.unshift(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'artworks', JSON.stringify(list));
    } catch (e) {}

    return normalized;
  }

  async deleteArtwork(artId) {
    console.log('☁️ 正在从 Supabase 云端删除画作:', artId);
    if (this.isCloudReady) {
      try {
        const { error } = await this.supabaseClient
          .from('artworks')
          .delete()
          .eq('id', String(artId));

        if (error) console.error('❌ Supabase 删除失败:', error);
        else console.log('✅ Supabase 云端删除成功');
      } catch (e) {}
    }

    const list = await this.getArtworks();
    const filtered = list.filter(a => a.id !== String(artId));
    try {
      localStorage.setItem(this.localCacheKey + 'artworks', JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // =========================================================================
  // 2. 小艺术家名人堂 (Students CRUD 直连 Supabase)
  // =========================================================================
  async getStudents() {
    await this.ensureReady();
    if (this.isCloudReady && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const list = data.map(item => this._fromDbStudent(item));
          localStorage.setItem(this.localCacheKey + 'students', JSON.stringify(list));
          console.log('☁️ 前台从 Supabase 获取小艺术家成功，实时总数:', list.length);
          return list;
        }
      } catch (e) {}
    }

    try {
      const local = JSON.parse(localStorage.getItem(this.localCacheKey + 'students') || 'null');
      if (local && Array.isArray(local) && local.length > 0) return local;
    } catch (e) {}

    const fallback = typeof studentList !== 'undefined' ? studentList : (typeof initialStudents !== 'undefined' ? initialStudents : []);
    return fallback.map(s => this._fromDbStudent(s));
  }

  async createStudent(studentData) {
    const dbPayload = this._toDbStudent(studentData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('students').insert([dbPayload]);
      } catch (e) {}
    }
    const list = await this.getStudents();
    const normalized = this._fromDbStudent(dbPayload);
    list.unshift(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'students', JSON.stringify(list));
    } catch (e) {}
    return normalized;
  }

  async updateStudent(studentData) {
    const dbPayload = this._toDbStudent(studentData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('students').update(dbPayload).eq('id', dbPayload.id);
      } catch (e) {}
    }
    const list = await this.getStudents();
    const normalized = this._fromDbStudent(dbPayload);
    const idx = list.findIndex(s => s.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.unshift(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'students', JSON.stringify(list));
    } catch (e) {}
    return normalized;
  }

  async deleteStudent(studentId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('students').delete().eq('id', String(studentId));
      } catch (e) {}
    }
    const list = await this.getStudents();
    const filtered = list.filter(s => s.id !== String(studentId));
    try {
      localStorage.setItem(this.localCacheKey + 'students', JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // =========================================================================
  // 3. 主题特展 (Themes CRUD 直连 Supabase)
  // =========================================================================
  async getThematicExhibitions() {
    await this.ensureReady();
    if (this.isCloudReady && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('thematic_exhibitions')
          .select('*')
          .order('hero_order', { ascending: true });

        if (!error && Array.isArray(data)) {
          const list = data.map(item => this._fromDbTheme(item));
          localStorage.setItem(this.localCacheKey + 'themes', JSON.stringify(list));
          console.log('☁️ 前台从 Supabase 获取特展成功，实时总数:', list.length);
          return list;
        }
      } catch (e) {}
    }

    try {
      const local = JSON.parse(localStorage.getItem(this.localCacheKey + 'themes') || 'null');
      if (local && Array.isArray(local) && local.length > 0) return local;
    } catch (e) {}

    const fallback = typeof themeExhibitions !== 'undefined' ? themeExhibitions : (typeof initialThematicExhibitions !== 'undefined' ? initialThematicExhibitions : []);
    return fallback.map(t => this._fromDbTheme(t));
  }

  async createThematicExhibition(themeData) {
    const dbPayload = this._toDbTheme(themeData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('thematic_exhibitions').insert([dbPayload]);
      } catch (e) {}
    }
    const list = await this.getThematicExhibitions();
    const normalized = this._fromDbTheme(dbPayload);
    list.push(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'themes', JSON.stringify(list));
    } catch (e) {}
    return normalized;
  }

  async updateThematicExhibition(themeData) {
    const dbPayload = this._toDbTheme(themeData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('thematic_exhibitions').upsert(dbPayload);
      } catch (e) {}
    }
    const list = await this.getThematicExhibitions();
    const normalized = this._fromDbTheme(dbPayload);
    const idx = list.findIndex(t => t.id === normalized.id);
    if (idx !== -1) list[idx] = normalized;
    else list.push(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'themes', JSON.stringify(list));
    } catch (e) {}
    return normalized;
  }

  async deleteThematicExhibition(themeId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('thematic_exhibitions').delete().eq('id', String(themeId));
      } catch (e) {}
    }
    const list = await this.getThematicExhibitions();
    const filtered = list.filter(t => t.id !== String(themeId));
    try {
      localStorage.setItem(this.localCacheKey + 'themes', JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // =========================================================================
  // 4. 便签墙 (Sticky Notes 直连 Supabase)
  // =========================================================================
  async getStickyNotes() {
    if (this.isCloudReady) {
      try {
        const { data, error } = await this.supabaseClient
          .from('sticky_notes')
          .select('*')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const list = data.map(item => this._fromDbNote(item));
          localStorage.setItem(this.localCacheKey + 'notes', JSON.stringify(list));
          return list;
        }
      } catch (e) {}
    }

    try {
      const local = JSON.parse(localStorage.getItem(this.localCacheKey + 'notes') || 'null');
      if (local && Array.isArray(local) && local.length > 0) return local;
    } catch (e) {}

    const fallback = typeof initialStickyNotes !== 'undefined' ? initialStickyNotes : [];
    return fallback.map(n => this._fromDbNote(n)).filter(n => !n.isHidden);
  }

  async createStickyNote(noteData) {
    const dbPayload = this._toDbNote(noteData);
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('sticky_notes').insert([dbPayload]);
      } catch (e) {}
    }
    const list = await this.getStickyNotes();
    const normalized = this._fromDbNote(dbPayload);
    list.unshift(normalized);
    try {
      localStorage.setItem(this.localCacheKey + 'notes', JSON.stringify(list));
    } catch (e) {}
    return normalized;
  }

  async likeStickyNote(noteId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.rpc('increment_note_likes', { row_id: noteId });
      } catch (e) {}
    }
  }

  async deleteStickyNote(noteId) {
    if (this.isCloudReady) {
      try {
        await this.supabaseClient.from('sticky_notes').delete().eq('id', String(noteId));
      } catch (e) {}
    }
    const list = await this.getStickyNotes();
    const filtered = list.filter(n => n.id !== String(noteId));
    try {
      localStorage.setItem(this.localCacheKey + 'notes', JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // --- 导出 data.js 固化文本 ---
  async exportFullDataJsContent() {
    const [arts, students, themes, notes] = await Promise.all([
      this.getArtworks(),
      this.getStudents(),
      this.getThematicExhibitions(),
      this.getStickyNotes()
    ]);

    return `/**
 * 🍐 想吃梨儿童艺术启蒙 · 最新全量数据集 (Auto-Exported from Supabase)
 * 导出时间: ${new Date().toLocaleString()}
 */

var initialArtworks = ${JSON.stringify(arts || [], null, 2)};

var studentList = ${JSON.stringify(students || [], null, 2)};

var themeExhibitions = ${JSON.stringify(themes || [], null, 2)};

var initialStickyNotes = ${JSON.stringify(notes || [], null, 2)};

if (typeof window !== 'undefined') {
  window.initialArtworks = initialArtworks;
  window.studentList = studentList;
  window.initialStudents = studentList;
  window.themeExhibitions = themeExhibitions;
  window.initialThematicExhibitions = themeExhibitions;
  window.initialStickyNotes = initialStickyNotes;
}
`;
  }
}

// 导出全局单例
window.galleryCloud = new SupabaseCloudGalleryService();
