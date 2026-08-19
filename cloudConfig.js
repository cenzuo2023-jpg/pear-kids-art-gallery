/**
 * 🍐 想吃梨 · 原生零依赖 Supabase 云数据库直连引擎 (Pure Native Fetch Engine)
 * 
 * 架构优势：
 * 1. 【零第三方 SDK 依赖】: 直接使用浏览器原生 fetch() 发起 HTTP REST 请求。
 * 2. 【Local-First 毫秒直连】: 双向同步本地持久化缓存，保障 0 毫秒秒开且绝不反弹重复。
 * 3. 【三方绝对一致】: 数据库 -> 后台 -> 前台 全链路标准 REST API 直通。
 */

const SUPABASE_URL = "https://hnzddhxgzbkllnmwpvdi.supabase.co";
const SUPABASE_KEY = "sb_publishable_xHnY5J95z8B5pPLGMf2w9w_pLGfZXC9";

const REST_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

class NativeSupabaseService {
  constructor() {
    console.log('🚀 原生 Supabase REST 引擎已就绪:', SUPABASE_URL);
  }

  async _request(path, options = {}, label = '云端请求') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        ...options,
        headers: {
          ...REST_HEADERS,
          ...(options.headers || {})
        },
        cache: 'no-store',
        signal: controller.signal
      });

      const responseText = await res.text();
      if (!res.ok) {
        let detail = responseText;
        try {
          const parsed = responseText ? JSON.parse(responseText) : null;
          detail = parsed?.message || parsed?.details || parsed?.hint || responseText;
        } catch (e) {}
        throw new Error(`${label}失败（HTTP ${res.status}）${detail ? `：${detail}` : ''}`);
      }

      if (!responseText) return null;
      try {
        return JSON.parse(responseText);
      } catch (e) {
        return responseText;
      }
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new Error(`${label}超时，请检查网络后重试`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  _writeCache(key, list) {
    try {
      localStorage.setItem(`art_gallery_cache_${key}`, JSON.stringify(Array.isArray(list) ? list : []));
    } catch (e) {}
  }

  _singleRow(data, label) {
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== 'object') {
      throw new Error(label + '失败：云端没有返回已写入的记录');
    }
    return row;
  }

  // --- 字段映射 (DB -> Frontend) ---
  _fromDbArtwork(a) {
    if (!a) return null;
    const mainImg = a.image || (Array.isArray(a.images) && a.images[0]) || '';
    return {
      id: String(a.id || ''),
      title: a.title || '无题力作',
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
      title: String(a.title || '无题力作'),
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
      id: String(s.id || ''),
      name: s.name || '小艺术家',
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
      age_group: String(s.ageGroup || s.age_group || '3-5'),
      class_name: String(s.className || s.class_name || '启蒙创想班'),
      avatar: String(s.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'),
      bio: String(s.bio || ''),
      featured_art_count: parseInt(s.featuredArtCount || s.featured_art_count || 1)
    };
  }

  _fromDbTheme(t) {
    if (!t) return null;
    const rawIds = Array.isArray(t.artwork_ids) ? t.artwork_ids : (Array.isArray(t.artworkIds) ? t.artworkIds : []);
    return {
      id: String(t.id || ''),
      title: t.title || '',
      subTitle: t.subtitle || t.subTitle || '',
      tag: t.tag || '🌟 美育专栏',
      season: t.season || '',
      date: t.date || '2026.08',
      coverImage: t.cover_image || t.coverImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85',
      curator: t.curator || '想吃梨美育团队',
      artworkCount: rawIds.length,
      introSummary: t.intro || t.introSummary || '',
      curatorStatement: t.curator_note ? (Array.isArray(t.curator_note) ? t.curator_note : t.curator_note.split('\n\n')) : (Array.isArray(t.curatorStatement) ? t.curatorStatement : []),
      keyHighlights: Array.isArray(t.highlights) ? t.highlights : (Array.isArray(t.sections) ? t.sections : []),
      artworkIds: rawIds,
      artwork_ids: rawIds,
      isInHero: Boolean(t.is_in_hero !== false),
      heroOrder: parseInt(t.hero_order || 1)
    };
  }

  _toDbTheme(t) {
    const rawIds = Array.isArray(t.artworkIds) ? t.artworkIds : (Array.isArray(t.artwork_ids) ? t.artwork_ids : []);
    return {
      id: String(t.id || ('theme-' + Date.now())),
      title: String(t.title || ''),
      subtitle: String(t.subTitle || t.subtitle || ''),
      cover_image: String(t.coverImage || t.cover_image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85'),
      tag: String(t.tag || '🌟 美育专栏'),
      date: String(t.date || '2026.08'),
      intro: String(t.introSummary || t.intro || ''),
      curator_note: Array.isArray(t.curatorStatement) ? t.curatorStatement.join('\n\n') : String(t.curatorStatement || t.curator_note || ''),
      artwork_ids: rawIds,
      sections: Array.isArray(t.keyHighlights) ? t.keyHighlights : (Array.isArray(t.sections) ? t.sections : []),
      is_in_hero: Boolean(t.isInHero !== false),
      hero_order: parseInt(t.heroOrder || t.hero_order || 1)
    };
  }

  _fromDbAlbum(row) {
    if (!row) return null;
    const artworks = Array.isArray(row.sections) ? row.sections : (Array.isArray(row.artworks) ? row.artworks : []);
    let ageGroup = '3-5';
    if (row.tag && String(row.tag).includes('album:')) {
      ageGroup = String(row.tag).replace('album:', '').trim();
    } else if (row.age_group || row.ageGroup) {
      ageGroup = row.age_group || row.ageGroup;
    }
    return {
      id: String(row.id || ''),
      title: row.title || '课程作品集',
      subTitle: row.subtitle || row.sub_title || '',
      tag: row.tag || '🎨 课程探索画册',
      date: row.date || '2026.08',
      ageGroup: ageGroup,
      className: row.subtitle || row.class_name || '启蒙创想班',
      coverImage: row.cover_image || row.coverImage || (artworks[0] ? artworks[0].image : 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85'),
      introSummary: row.intro || row.intro_summary || row.introSummary || '',
      teacherNotes: row.curator_note || row.teacher_notes || row.teacherNotes || '',
      artworks: artworks,
      artworkCount: artworks.length
    };
  }

  _toDbAlbum(a) {
    const artworks = Array.isArray(a.artworks) ? a.artworks : [];
    const ageGroup = a.ageGroup || '3-5';
    return {
      id: String(a.id || ('album-' + Date.now())),
      title: String(a.title || '课程探索画册'),
      subtitle: String(a.className || a.subTitle || a.subtitle || '创想班'),
      cover_image: String(a.coverImage || a.cover_image || (artworks[0] ? artworks[0].image : 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85')),
      tag: `album:${ageGroup}`,
      date: String(a.date || '2026.08'),
      intro: String(a.introSummary || a.intro_summary || a.intro || ''),
      curator_note: String(a.teacherNotes || a.teacher_notes || a.teacherNote || ''),
      sections: artworks,
      artwork_ids: [],
      is_in_hero: false,
      hero_order: 99
    };
  }

  _fromDbNote(n) {
    if (!n) return null;
    return {
      id: String(n.id || ''),
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
  // 1. 少儿画作 (Artworks REST API)
  // =========================================================================
  async getArtworks() {
    const data = await this._request(
      '/rest/v1/artworks?select=*&order=created_at.desc',
      { method: 'GET' },
      '读取画作'
    );
    const list = (data || []).map(item => this._fromDbArtwork(item)).filter(Boolean);
    this._writeCache('artworks', list);
    console.log('🖼️ 成功直连 Supabase 拉取画作:', list.length, '件');
    return list;
  }

  async createArtwork(artData) {
    const payload = this._toDbArtwork(artData);
    const data = await this._request(
      '/rest/v1/artworks',
      { method: 'POST', body: JSON.stringify(payload) },
      '保存画作'
    );
    const created = this._fromDbArtwork(this._singleRow(data, '保存画作'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_artworks');
      let list = cached ? JSON.parse(cached) : [];
      list = list.filter(a => String(a.id) !== String(created.id));
      list.unshift(created);
      localStorage.setItem('art_gallery_cache_artworks', JSON.stringify(list));
    } catch (e) {}
    return created;
  }

  async updateArtwork(artData) {
    const payload = this._toDbArtwork(artData);
    const data = await this._request(
      `/rest/v1/artworks?id=eq.${encodeURIComponent(payload.id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      '更新画作'
    );
    const updated = this._fromDbArtwork(this._singleRow(data, '更新画作'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_artworks');
      let list = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(a => String(a.id) === String(updated.id));
      if (idx !== -1) list[idx] = updated;
      else list.unshift(updated);
      localStorage.setItem('art_gallery_cache_artworks', JSON.stringify(list));
    } catch (e) {}
    return updated;
  }

  async deleteArtwork(artId) {
    const deleted = await this._request(
      `/rest/v1/artworks?id=eq.${encodeURIComponent(artId)}`,
      { method: 'DELETE' },
      '删除画作'
    );
    this._singleRow(deleted, '删除画作');

    try {
      const cached = localStorage.getItem('art_gallery_cache_artworks');
      if (cached) {
        let list = JSON.parse(cached);
        list = list.filter(a => String(a.id) !== String(artId));
        localStorage.setItem('art_gallery_cache_artworks', JSON.stringify(list));
      }
    } catch (e) {}

    return true;
  }

  // =========================================================================
  // 2. 小艺术家名人堂 (Students REST API)
  // =========================================================================
  async getStudents() {
    const data = await this._request(
      '/rest/v1/students?select=*&order=created_at.desc',
      { method: 'GET' },
      '读取小艺术家'
    );
    const list = (data || []).map(item => this._fromDbStudent(item)).filter(Boolean);
    this._writeCache('students', list);
    console.log('👑 成功直连 Supabase 拉取小艺术家:', list.length, '位');
    return list;
  }

  async createStudent(studentData) {
    const payload = this._toDbStudent(studentData);
    const data = await this._request(
      '/rest/v1/students',
      { method: 'POST', body: JSON.stringify(payload) },
      '保存小艺术家'
    );
    const created = this._fromDbStudent(this._singleRow(data, '保存小艺术家'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_students');
      let list = cached ? JSON.parse(cached) : [];
      list = list.filter(s => String(s.id) !== String(created.id));
      list.unshift(created);
      localStorage.setItem('art_gallery_cache_students', JSON.stringify(list));
    } catch (e) {}
    return created;
  }

  async updateStudent(studentData) {
    const payload = this._toDbStudent(studentData);
    const data = await this._request(
      `/rest/v1/students?id=eq.${encodeURIComponent(payload.id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      '更新小艺术家'
    );
    const updated = this._fromDbStudent(this._singleRow(data, '更新小艺术家'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_students');
      let list = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(s => String(s.id) === String(updated.id));
      if (idx !== -1) list[idx] = updated;
      else list.unshift(updated);
      localStorage.setItem('art_gallery_cache_students', JSON.stringify(list));
    } catch (e) {}
    return updated;
  }

  async deleteStudent(studentId) {
    const deleted = await this._request(
      `/rest/v1/students?id=eq.${encodeURIComponent(studentId)}`,
      { method: 'DELETE' },
      '删除小艺术家'
    );
    this._singleRow(deleted, '删除小艺术家');

    try {
      const cached = localStorage.getItem('art_gallery_cache_students');
      if (cached) {
        let list = JSON.parse(cached);
        list = list.filter(s => String(s.id) !== String(studentId));
        localStorage.setItem('art_gallery_cache_students', JSON.stringify(list));
      }
    } catch (e) {}

    return true;
  }

  // =========================================================================
  // 3. 美育专栏 / 博客文章 (Thematic Articles REST API)
  // =========================================================================
  async getThematicExhibitions() {
    const data = await this._request(
      '/rest/v1/thematic_exhibitions?select=*&order=created_at.desc',
      { method: 'GET' },
      '读取特展'
    );
    const list = (data || [])
      .filter(item => !String(item.id).startsWith('album-') && !String(item.tag || '').startsWith('album:'))
      .map(item => this._fromDbTheme(item))
      .filter(Boolean);
    this._writeCache('themes', list);
    return list;
  }

  async createThematicExhibition(themeData) {
    const payload = this._toDbTheme(themeData);
    const data = await this._request(
      '/rest/v1/thematic_exhibitions',
      { method: 'POST', body: JSON.stringify(payload) },
      '保存特展'
    );
    const created = this._fromDbTheme(this._singleRow(data, '保存特展'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_themes');
      let list = cached ? JSON.parse(cached) : [];
      list = list.filter(t => String(t.id) !== String(created.id));
      list.unshift(created);
      localStorage.setItem('art_gallery_cache_themes', JSON.stringify(list));
    } catch (e) {}
    return created;
  }

  async updateThematicExhibition(themeData) {
    const payload = this._toDbTheme(themeData);
    const data = await this._request(
      `/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(payload.id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      '更新特展'
    );
    const updated = this._fromDbTheme(this._singleRow(data, '更新特展'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_themes');
      let list = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(t => String(t.id) === String(updated.id));
      if (idx !== -1) list[idx] = updated;
      else list.unshift(updated);
      localStorage.setItem('art_gallery_cache_themes', JSON.stringify(list));
    } catch (e) {}
    return updated;
  }

  async deleteThematicExhibition(themeId) {
    const deleted = await this._request(
      `/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(themeId)}`,
      { method: 'DELETE' },
      '删除特展'
    );
    this._singleRow(deleted, '删除特展');

    try {
      const cached = localStorage.getItem('art_gallery_cache_themes');
      if (cached) {
        let list = JSON.parse(cached);
        list = list.filter(t => String(t.id) !== String(themeId));
        localStorage.setItem('art_gallery_cache_themes', JSON.stringify(list));
      }
    } catch (e) {}

    return true;
  }

  // =========================================================================
  // 4. 便签墙 (Sticky Notes REST API)
  // =========================================================================
  async getStickyNotes() {
    const data = await this._request(
      '/rest/v1/sticky_notes?select=*&is_hidden=eq.false&order=created_at.desc',
      { method: 'GET' },
      '读取便签'
    );
    const list = (data || []).map(item => this._fromDbNote(item)).filter(Boolean);
    this._writeCache('notes', list);
    return list;
  }

  async createStickyNote(noteData) {
    const payload = this._toDbNote(noteData);
    const data = await this._request(
      '/rest/v1/sticky_notes',
      { method: 'POST', body: JSON.stringify(payload) },
      '发布便签'
    );
    const created = this._fromDbNote(this._singleRow(data, '发布便签'));
    try {
      const cached = localStorage.getItem('art_gallery_cache_notes');
      let list = cached ? JSON.parse(cached) : [];
      list = list.filter(n => String(n.id) !== String(created.id));
      list.unshift(created);
      localStorage.setItem('art_gallery_cache_notes', JSON.stringify(list));
    } catch (e) {}
    return created;
  }

  async likeStickyNote(noteId) {
    await this._request(
      '/rest/v1/rpc/increment_note_likes',
      {
        method: 'POST',
        body: JSON.stringify({ row_id: String(noteId) })
      },
      '更新便签点赞'
    );
    return true;
  }

  async deleteStickyNote(noteId) {
    const deleted = await this._request(
      `/rest/v1/sticky_notes?id=eq.${encodeURIComponent(noteId)}`,
      { method: 'DELETE' },
      '删除便签'
    );
    this._singleRow(deleted, '删除便签');

    try {
      const cached = localStorage.getItem('art_gallery_cache_notes');
      if (cached) {
        let list = JSON.parse(cached);
        list = list.filter(n => String(n.id) !== String(noteId));
        localStorage.setItem('art_gallery_cache_notes', JSON.stringify(list));
      }
    } catch (e) {}

    return true;
  }

  // =========================================================================
  // 5. 课程作品集 (Course Albums / Portfolios - Supabase 云端为唯一数据源)
  // =========================================================================
  async getCourseAlbums() {
    const data = await this._request(
      '/rest/v1/thematic_exhibitions?select=*&order=created_at.desc',
      { method: 'GET' },
      '读取课程作品集'
    );
    const list = (data || [])
      .filter(item => String(item.id).startsWith('album-') || String(item.tag || '').startsWith('album:'))
      .map(item => this._fromDbAlbum(item))
      .filter(Boolean);

    this._writeCache('albums', list);
    try {
      localStorage.setItem('pear_course_albums', JSON.stringify(list));
    } catch (e) {}
    console.log('📚 成功直连 Supabase 拉取课程作品集:', list.length, '套');
    return list;
  }

  async createCourseAlbum(albumData) {
    const payload = this._toDbAlbum(albumData);
    const data = await this._request(
      '/rest/v1/thematic_exhibitions',
      { method: 'POST', body: JSON.stringify(payload) },
      '保存课程作品集'
    );
    const created = this._fromDbAlbum(this._singleRow(data, '保存课程作品集'));
    const list = await this.getCourseAlbums();
    this._writeCache('albums', list);
    return created;
  }

  async updateCourseAlbum(albumData) {
    const payload = this._toDbAlbum(albumData);
    const data = await this._request(
      `/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(payload.id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      '更新课程作品集'
    );
    const updated = this._fromDbAlbum(this._singleRow(data, '更新课程作品集'));
    const list = await this.getCourseAlbums();
    this._writeCache('albums', list);
    return updated;
  }

  async deleteCourseAlbum(albumId) {
    const deleted = await this._request(
      `/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(albumId)}`,
      { method: 'DELETE' },
      '删除课程作品集'
    );
    this._singleRow(deleted, '删除课程作品集');
    const list = await this.getCourseAlbums();
    this._writeCache('albums', list);
    return true;
  }
}

// 导出全局单例
if (typeof window !== 'undefined') {
  window.galleryCloud = new NativeSupabaseService();
  console.log('⚡ 全局云端直连服务 window.galleryCloud 已注入');
}