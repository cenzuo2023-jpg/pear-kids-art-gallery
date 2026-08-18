/**
 * 🍐 想吃梨儿童艺术启蒙 · 纯粹 Supabase 云端数据库直连引擎 (100% Pure Cloud Database)
 * 
 * 核心原则：
 * 1. 【唯一真实源】: 所有数据 100% 以 Supabase 云端 PostgreSQL 数据库为准，彻底废弃任何本地假缓存。
 * 2. 【前后端完全一致】: 前台展厅与后台管理系统直接从 Supabase 读取同一份云端数据，零差异。
 * 3. 【精准字段双向映射】: 数据库蛇形字段 (snake_case) 与前端驼峰 (camelCase) 严丝合缝对齐。
 */

const CLOUD_CONFIG = {
  supabase: {
    enabled: true,
    url: "https://hnzddhxgzbkllnmwpvdi.supabase.co",
    anonKey: "sb_publishable_xHnY5J95z8B5pPLGMf2w9w_pLGfZXC9"
  }
};

class PureSupabaseGalleryService {
  constructor() {
    this.isCloudReady = false;
    this.supabaseClient = null;
    this._init();
  }

  _init() {
    if (window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(
          CLOUD_CONFIG.supabase.url,
          CLOUD_CONFIG.supabase.anonKey
        );
        this.isCloudReady = true;
        console.log('☁️ Supabase 客户端连接成功:', CLOUD_CONFIG.supabase.url);
      } catch (e) {
        console.error('❌ Supabase 客户端初始化失败:', e);
      }
    }
  }

  async ensureReady() {
    if (this.isCloudReady && this.supabaseClient) return true;
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        attempts++;
        if (window.supabase && !this.supabaseClient) {
          this._init();
        }
        if (this.isCloudReady && this.supabaseClient) {
          resolve(true);
        } else if (attempts > 30) {
          console.warn('⚠️ Supabase 连接等待超时');
          resolve(false);
        } else {
          setTimeout(check, 80);
        }
      };
      check();
    });
  }

  // --- 1. 画作字段映射 (Artworks) ---
  _fromDbArtwork(a) {
    if (!a) return null;
    const mainImg = a.image || (Array.isArray(a.images) && a.images[0]) || '';
    return {
      id: String(a.id),
      title: a.title || '无题作品',
      author: a.author || '小艺术家',
      age: a.age || '5岁',
      ageGroup: a.age_group || '3-5',
      category: a.category || 'oil-pastel',
      categoryName: a.category_name || '少儿绘画',
      date: a.date || '2026.08',
      image: mainImg,
      images: Array.isArray(a.images) && a.images.length > 0 ? a.images : (mainImg ? [mainImg] : []),
      story: a.story || '',
      audioDuration: a.audio_duration || '00:24',
      audioUrl: a.audio_url || '',
      teacherComment: a.teacher_comment || '',
      isFeatured: Boolean(a.is_featured)
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
      age_group: String(a.ageGroup || '3-5'),
      category: String(a.category || 'oil-pastel'),
      category_name: String(a.categoryName || '少儿绘画'),
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

  // --- 2. 小艺术家字段映射 (Students) ---
  _fromDbStudent(s) {
    if (!s) return null;
    return {
      id: String(s.id),
      name: s.name || '',
      age: s.age || '5岁',
      ageGroup: s.age_group || '3-5',
      className: s.class_name || '启蒙创想班',
      avatar: s.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      bio: s.bio || '',
      featuredArtCount: parseInt(s.featured_art_count || 1)
    };
  }

  _toDbStudent(s) {
    return {
      id: String(s.id || ('s-' + Date.now())),
      name: String(s.name || '小画家'),
      age: String(s.age || '5岁'),
      age_group: String(s.ageGroup || '3-5'),
      class_name: String(s.className || '启蒙创想班'),
      avatar: String(s.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'),
      bio: String(s.bio || ''),
      featured_art_count: parseInt(s.featuredArtCount || 1)
    };
  }

  // --- 3. 主题特展字段映射 (Themes) ---
  _fromDbTheme(t) {
    if (!t) return null;
    return {
      id: String(t.id),
      title: t.title || '',
      subTitle: t.subtitle || '',
      tag: t.tag || '🌟 特别策划',
      season: t.season || '',
      date: t.date || '2026.08',
      coverImage: t.cover_image || '',
      curator: t.curator || '陈昨 & 想吃梨教研组',
      artworkCount: Array.isArray(t.artwork_ids) ? t.artwork_ids.length : 0,
      introSummary: t.intro || '',
      curatorStatement: t.curator_note ? t.curator_note.split('\n\n') : [],
      keyHighlights: Array.isArray(t.highlights) ? t.highlights : (Array.isArray(t.sections) ? t.sections : []),
      artworkIds: Array.isArray(t.artwork_ids) ? t.artwork_ids : [],
      isInHero: Boolean(t.is_in_hero !== false),
      heroOrder: parseInt(t.hero_order || 1)
    };
  }

  _toDbTheme(t) {
    return {
      id: String(t.id || ('theme-' + Date.now())),
      title: String(t.title || ''),
      subtitle: String(t.subTitle || ''),
      cover_image: String(t.coverImage || ''),
      tag: String(t.tag || '🌟 特别策划'),
      date: String(t.date || '2026.08'),
      intro: String(t.introSummary || ''),
      curator_note: Array.isArray(t.curatorStatement) ? t.curatorStatement.join('\n\n') : String(t.curatorStatement || ''),
      artwork_ids: Array.isArray(t.artworkIds) ? t.artworkIds : [],
      is_in_hero: Boolean(t.isInHero !== false),
      hero_order: parseInt(t.heroOrder || 1)
    };
  }

  // --- 4. 便签墙字段映射 (Sticky Notes) ---
  _fromDbNote(n) {
    if (!n) return null;
    return {
      id: String(n.id),
      type: n.type || 'text',
      author: n.author || '艺术友人',
      role: n.role || 'visitor',
      roleName: n.role_name || '',
      color: n.color || 'yellow',
      content: n.content || '',
      artworkTitle: n.artwork_title || '',
      artworkImage: n.artwork_image || '',
      tag: n.tag || '#想吃梨美育',
      date: n.date || '2026.08',
      likes: parseInt(n.likes || 0),
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
      role_name: String(n.roleName || ''),
      color: String(n.color || 'yellow'),
      content: String(n.content || ''),
      artwork_title: String(n.artworkTitle || ''),
      artwork_image: String(n.artworkImage || ''),
      tag: String(n.tag || '#想吃梨美育'),
      date: String(n.date || '2026.08'),
      likes: parseInt(n.likes || 0),
      is_hidden: Boolean(n.isHidden)
    };
  }

  // =========================================================================
  // 1. 作品接口 (Artworks) - 100% 纯读写 Supabase
  // =========================================================================
  async getArtworks() {
    await this.ensureReady();
    if (!this.supabaseClient) return [];
    try {
      const { data, error } = await this.supabaseClient
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase 获取作品失败:', error);
        return [];
      }
      return (data || []).map(item => this._fromDbArtwork(item));
    } catch (e) {
      console.error('❌ 读取 Supabase artworks 异常:', e);
      return [];
    }
  }

  async createArtwork(artData) {
    await this.ensureReady();
    const dbPayload = this._toDbArtwork(artData);
    if (!this.supabaseClient) return this._fromDbArtwork(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('artworks')
        .insert([dbPayload])
        .select();

      if (error) {
        console.error('❌ Supabase 录入画作失败:', error);
        if (window.showToast) window.showToast(`❌ 云端保存失败: ${error.message}`);
        throw error;
      } else {
        console.log('✅ Supabase 录入画作成功:', data);
        if (window.showToast) window.showToast(`☁️ 已成功存入 Supabase 云端数据库！`);
        return this._fromDbArtwork(data[0] || dbPayload);
      }
    } catch (e) {
      throw e;
    }
  }

  async updateArtwork(artData) {
    await this.ensureReady();
    const dbPayload = this._toDbArtwork(artData);
    if (!this.supabaseClient) return this._fromDbArtwork(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('artworks')
        .update(dbPayload)
        .eq('id', dbPayload.id)
        .select();

      if (error) {
        console.error('❌ Supabase 更新画作失败:', error);
        if (window.showToast) window.showToast(`❌ 云端更新失败: ${error.message}`);
        throw error;
      } else {
        console.log('✅ Supabase 更新画作成功:', data);
        if (window.showToast) window.showToast(`☁️ 云端数据库已同步更新！`);
        return this._fromDbArtwork(data[0] || dbPayload);
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteArtwork(artId) {
    await this.ensureReady();
    if (!this.supabaseClient) return true;
    try {
      const { error } = await this.supabaseClient
        .from('artworks')
        .delete()
        .eq('id', String(artId));

      if (error) {
        console.error('❌ Supabase 删除画作失败:', error);
        if (window.showToast) window.showToast(`❌ 云端删除失败: ${error.message}`);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // 2. 小艺术家名人堂 (Students) - 100% 纯读写 Supabase
  // =========================================================================
  async getStudents() {
    await this.ensureReady();
    if (!this.supabaseClient) return [];
    try {
      const { data, error } = await this.supabaseClient
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase 获取小艺术家失败:', error);
        return [];
      }
      return (data || []).map(item => this._fromDbStudent(item));
    } catch (e) {
      return [];
    }
  }

  async createStudent(studentData) {
    await this.ensureReady();
    const dbPayload = this._toDbStudent(studentData);
    if (!this.supabaseClient) return this._fromDbStudent(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('students')
        .insert([dbPayload])
        .select();

      if (error) {
        console.error('❌ Supabase 录入小艺术家失败:', error);
        throw error;
      }
      return this._fromDbStudent(data[0] || dbPayload);
    } catch (e) {
      throw e;
    }
  }

  async updateStudent(studentData) {
    await this.ensureReady();
    const dbPayload = this._toDbStudent(studentData);
    if (!this.supabaseClient) return this._fromDbStudent(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('students')
        .update(dbPayload)
        .eq('id', dbPayload.id)
        .select();

      if (error) {
        console.error('❌ Supabase 更新小艺术家失败:', error);
        throw error;
      }
      return this._fromDbStudent(data[0] || dbPayload);
    } catch (e) {
      throw e;
    }
  }

  async deleteStudent(studentId) {
    await this.ensureReady();
    if (!this.supabaseClient) return true;
    try {
      const { error } = await this.supabaseClient
        .from('students')
        .delete()
        .eq('id', String(studentId));

      if (error) {
        console.error('❌ Supabase 删除小艺术家失败:', error);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // 3. 主题特展 (Themes) - 100% 纯读写 Supabase
  // =========================================================================
  async getThematicExhibitions() {
    await this.ensureReady();
    if (!this.supabaseClient) return [];
    try {
      const { data, error } = await this.supabaseClient
        .from('thematic_exhibitions')
        .select('*')
        .order('hero_order', { ascending: true });

      if (error) {
        console.error('❌ Supabase 获取特展失败:', error);
        return [];
      }
      return (data || []).map(item => this._fromDbTheme(item));
    } catch (e) {
      return [];
    }
  }

  async createThematicExhibition(themeData) {
    await this.ensureReady();
    const dbPayload = this._toDbTheme(themeData);
    if (!this.supabaseClient) return this._fromDbTheme(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('thematic_exhibitions')
        .insert([dbPayload])
        .select();

      if (error) throw error;
      return this._fromDbTheme(data[0] || dbPayload);
    } catch (e) {
      throw e;
    }
  }

  async updateThematicExhibition(themeData) {
    await this.ensureReady();
    const dbPayload = this._toDbTheme(themeData);
    if (!this.supabaseClient) return this._fromDbTheme(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('thematic_exhibitions')
        .upsert(dbPayload)
        .select();

      if (error) throw error;
      return this._fromDbTheme(data[0] || dbPayload);
    } catch (e) {
      throw e;
    }
  }

  async deleteThematicExhibition(themeId) {
    await this.ensureReady();
    if (!this.supabaseClient) return true;
    try {
      const { error } = await this.supabaseClient
        .from('thematic_exhibitions')
        .delete()
        .eq('id', String(themeId));

      if (error) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // 4. 便签墙 (Sticky Notes) - 100% 纯读写 Supabase
  // =========================================================================
  async getStickyNotes() {
    await this.ensureReady();
    if (!this.supabaseClient) return [];
    try {
      const { data, error } = await this.supabaseClient
        .from('sticky_notes')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map(item => this._fromDbNote(item));
    } catch (e) {
      return [];
    }
  }

  async createStickyNote(noteData) {
    await this.ensureReady();
    const dbPayload = this._toDbNote(noteData);
    if (!this.supabaseClient) return this._fromDbNote(dbPayload);

    try {
      const { data, error } = await this.supabaseClient
        .from('sticky_notes')
        .insert([dbPayload])
        .select();

      if (error) throw error;
      return this._fromDbNote(data[0] || dbPayload);
    } catch (e) {
      throw e;
    }
  }

  async likeStickyNote(noteId) {
    await this.ensureReady();
    if (!this.supabaseClient) return;
    try {
      await this.supabaseClient.rpc('increment_note_likes', { row_id: String(noteId) });
    } catch (e) {}
  }

  async deleteStickyNote(noteId) {
    await this.ensureReady();
    if (!this.supabaseClient) return true;
    try {
      await this.supabaseClient
        .from('sticky_notes')
        .delete()
        .eq('id', String(noteId));
      return true;
    } catch (e) {
      return false;
    }
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
window.galleryCloud = new PureSupabaseGalleryService();
