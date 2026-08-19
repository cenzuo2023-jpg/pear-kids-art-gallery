/**
 * 🍐 想吃梨 · 原生零依赖 Supabase 云数据库直连引擎 (Pure Native Fetch Engine)
 * 
 * 架构升级 (v3.0 性能与存储重构版)：
 * 1. 【列表轻量化】: 列表请求彻底排除 sections / curator_note 等大字段，杜绝 Base64 导致的 PostgreSQL statement timeout (HTTP 500)。
 * 2. 【详情按需加载】: 浏览/编辑具体特展或画册详情时，按需单条请求完整数据。
 * 3. 【原生对象存储】: 新上传图片统一上传至 Supabase Storage (course-media)，只在数据库存 URL。
 * 4. 【全兼容与幂等】: 100% 兼容存量 Base64 与新 Storage URL。
 * 5. 【查询防重合并】: 同一周期内的重复列表查询自动共享在途 Promise。
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
    console.log('🚀 原生 Supabase REST 引擎已就绪 (v3.0 轻量化与对象存储架构):', SUPABASE_URL);
    this._themesListPromise = null;
    this._albumsListPromise = null;
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

  _compactCacheList(key, list) {
    const source = Array.isArray(list) ? list : [];
    if (key === 'artworks') {
      return source.map(item => ({ ...item, images: item.image ? [item.image] : [] }));
    }
    if (key === 'students') {
      return source.map(item => ({
        ...item,
        avatar: String(item.avatar || '').startsWith('data:image/')
          ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
          : item.avatar,
        avatarLoaded: false
      }));
    }
    if (key === 'themes') {
      return source.map(item => ({ ...item, curatorStatement: [], contentLoaded: false }));
    }
    if (key === 'albums') {
      return source.map(item => ({
        ...item,
        artworkCount: Array.isArray(item.artworks) ? item.artworks.length : (item.artworkCount || 0),
        artworks: []
      }));
    }
    return source;
  }

  _writeCache(key, list) {
    try {
      localStorage.setItem(`art_gallery_cache_${key}`, JSON.stringify(this._compactCacheList(key, list)));
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
      avatarLoaded: Object.prototype.hasOwnProperty.call(s, 'avatar'),
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
      heroOrder: parseInt(t.hero_order || 1),
      contentLoaded: Object.prototype.hasOwnProperty.call(t, 'curator_note')
    };
  }

  _toDbTheme(t) {
    const rawIds = Array.isArray(t.artworkIds) ? t.artworkIds : (Array.isArray(t.artwork_ids) ? t.artwork_ids : []);
    const sections = Array.isArray(t.keyHighlights) ? t.keyHighlights : (Array.isArray(t.sections) ? t.sections : []);
    return {
      id: String(t.id || ('theme-' + Date.now())),
      title: String(t.title || ''),
      subtitle: String(t.subTitle || t.subtitle || ''),
      cover_image: String(t.coverImage || t.cover_image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85'),
      tag: String(t.tag || '🌟 美育专栏'),
      date: String(t.date || '2026.08'),
      intro: String(t.introSummary || t.intro || ''),
      curator_note: Array.isArray(t.curatorStatement) ? t.curatorStatement.join('\n\n') : String(t.curatorStatement || t.curator_note || ''),
      sections: sections,
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
  // 0. 对象存储服务 (Supabase Storage API) - course-media Bucket
  // =========================================================================
  async uploadCourseMedia(fileOrBlob, folder = 'themes') {
    if (!fileOrBlob) throw new Error('未提供待上传的文件数据');
    
    // 生成安全文件名与扩展名
    const mimeType = fileOrBlob.type || 'image/jpeg';
    let ext = 'jpg';
    if (fileOrBlob.name && fileOrBlob.name.includes('.')) {
      ext = fileOrBlob.name.split('.').pop().toLowerCase();
    } else if (mimeType.includes('png')) {
      ext = 'png';
    } else if (mimeType.includes('webp')) {
      ext = 'webp';
    } else if (mimeType.includes('gif')) {
      ext = 'gif';
    }

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}_${randomSuffix}.${ext}`;
    const cleanFolder = folder.replace(/^\/+/, '').replace(/\/+$/, '');
    const storagePath = `${cleanFolder}/${fileName}`;

    console.log(`☁️ 正在上传图片至 Supabase Storage: course-media/${storagePath}`);

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/course-media/${storagePath}`, {
      method: 'POST',
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": mimeType,
        "x-upsert": "true"
      },
      body: fileOrBlob
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('❌ Supabase Storage 上传失败:', res.status, errText);
      throw new Error(`Storage 上传失败 (${res.status}): ${errText}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/course-media/${storagePath}`;
    console.log('✅ 图片成功上传至对象存储，公开 URL:', publicUrl);
    return publicUrl;
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

  // Frontend first paint omits the large Base64 avatar payload.
  // Avatars are hydrated separately; the admin still uses getStudents().
  async getStudentSummaries() {
    const data = await this._request(
      '/rest/v1/students?select=id,name,age,age_group,class_name,bio,featured_art_count,created_at&order=created_at.desc',
      { method: 'GET' },
      'Load student summaries'
    );
    return (data || []).map(item => this._fromDbStudent(item)).filter(Boolean);
  }

  async getStudentAvatars() {
    const data = await this._request(
      '/rest/v1/students?select=id,avatar&order=created_at.desc',
      { method: 'GET' },
      'Load student avatars'
    );
    return (data || []).map(item => ({
      id: String(item.id || ''),
      avatar: item.avatar || ''
    })).filter(item => item.id);
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
  // 3. 主题特展 (Thematic Exhibitions REST API - 轻量列表 + 按需详情)
  // =========================================================================
  /**
   * 🌟 1. 列表轻量查询：严禁拉取 sections、curator_note 等大字段，彻底杜绝 statement timeout (HTTP 500)
   */
  async getThematicExhibitions(limit = 30) {
    if (this._themesListPromise) return this._themesListPromise;

    this._themesListPromise = (async () => {
      try {
        const fields = 'id,title,subtitle,tag,date,intro,cover_image,is_in_hero,hero_order,created_at';
        const res = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?select=${fields}&order=hero_order.asc&limit=${limit}`, {
          method: 'GET',
          headers: REST_HEADERS
        });
        if (!res.ok) {
          console.warn('获取特展列表响应异常:', res.status);
          return [];
        }
        const data = await res.json();
        const list = (data || []).map(item => this._fromDbTheme(item)).filter(Boolean);
        try { localStorage.setItem('art_gallery_cache_themes', JSON.stringify(list)); } catch (e) {}
        console.log('🎨 成功获取轻量特展列表 (排除大图):', list.length, '期');
        return list;
      } catch (e) {
        console.error('getThematicExhibitions 异常:', e);
        return [];
      } finally {
        setTimeout(() => { this._themesListPromise = null; }, 500);
      }
    })();

    return this._themesListPromise;
  }

  /**
   * 🌟 2. 详情按需查询：用户进入具体特展页面时，单独通过 ID 获取完整数据 (含 sections, curator_note, artwork_ids)
   */
  async getThematicExhibitionById(themeId) {
    if (!themeId) return null;
    try {
      console.log(`🔍 正在按需拉取特展详情完整数据: ID = ${themeId}`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?select=*&id=eq.${encodeURIComponent(themeId)}&limit=1`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (!res.ok) {
        console.error('❌ 获取特展详情失败:', res.status, await res.text());
        return null;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return this._fromDbTheme(data[0]);
      }
      return null;
    } catch (e) {
      console.error(`getThematicExhibitionById [${themeId}] 异常:`, e);
      return null;
    }
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
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes?select=*&is_hidden=eq.false&order=created_at.desc`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list = (data || []).map(item => this._fromDbNote(item)).filter(Boolean);
      try { localStorage.setItem('art_gallery_cache_notes', JSON.stringify(list)); } catch (e) {}
      return list;
    } catch (e) {
      return [];
    }
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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes?id=eq.${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
      headers: REST_HEADERS
    });
    return res.ok;
  }

  // =========================================================================
  // 5. 课程作品集 (Course Albums / Portfolios REST API + 本地优先双重持久化)
  // =========================================================================
  async getCourseAlbums() {
    // 1. 尝试从 Supabase 云数据库拉取
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/course_albums?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list = data.map(item => this._fromDbAlbum(item)).filter(Boolean);
          try { localStorage.setItem('pear_course_albums', JSON.stringify(list)); } catch (e) {}
          return list;
        }
      }
    } catch (e) {}

    // 2. 本地持久化缓存兜底（确保后台录入后前台 100% 立即秒级可见）
    try {
      const cached = localStorage.getItem('pear_course_albums');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return typeof initialCourseAlbums !== 'undefined' ? initialCourseAlbums : [];
  }

  async getCourseAlbumById(albumId) {
    if (!albumId) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/course_albums?select=*&id=eq.${encodeURIComponent(albumId)}&limit=1`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return this._fromDbAlbum(data[0]);
        }
      }
    } catch (e) {}

    const albums = await this.getCourseAlbums();
    return albums.find(a => String(a.id) === String(albumId)) || null;
  }

  async createCourseAlbum(albumData) {
    // 1. 本地存储立即写入
    try {
      const cached = localStorage.getItem('pear_course_albums');
      let list = cached ? JSON.parse(cached) : (typeof initialCourseAlbums !== 'undefined' ? [...initialCourseAlbums] : []);
      list = list.filter(a => String(a.id) !== String(albumData.id));
      list.unshift(albumData);
      localStorage.setItem('pear_course_albums', JSON.stringify(list));
    } catch (e) {}

    // 2. 异步同步至 Supabase
    try {
      const payload = this._toDbAlbum(albumData);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/course_albums`, {
        method: 'POST',
        headers: REST_HEADERS,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return this._fromDbAlbum(Array.isArray(data) ? data[0] : data);
      }
    } catch (e) {}

    return albumData;
  }

  async updateCourseAlbum(albumData) {
    try {
      const cached = localStorage.getItem('pear_course_albums');
      let list = cached ? JSON.parse(cached) : (typeof initialCourseAlbums !== 'undefined' ? [...initialCourseAlbums] : []);
      const idx = list.findIndex(a => String(a.id) === String(albumData.id));
      if (idx !== -1) list[idx] = albumData;
      else list.unshift(albumData);
      localStorage.setItem('pear_course_albums', JSON.stringify(list));
    } catch (e) {}

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
      '/rest/v1/thematic_exhibitions?select=*&id=like.album-*&order=created_at.desc',
      { method: 'GET' },
      '读取课程作品集'
    );
    const list = (data || [])
      .filter(item => String(item.id).startsWith('album-') || String(item.tag || '').startsWith('album:'))
      .map(item => this._fromDbAlbum(item))
      .filter(Boolean);

    this._writeCache('albums', list);
    try { localStorage.removeItem('pear_course_albums'); } catch (e) {}
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