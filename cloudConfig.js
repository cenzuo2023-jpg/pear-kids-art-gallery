/**
 * 🍐 想吃梨儿童艺术启蒙 · 原生零依赖 Supabase 云数据库直连引擎 (Pure Native Fetch Engine)
 * 
 * 架构优势：
 * 1. 【零第三方 SDK 依赖】: 彻底摆脱外部 CDN 脚本加载延迟与拦截，直接使用浏览器原生 fetch() 发起 HTTP REST 请求。
 * 2. 【毫秒级瞬间直连】: 页面打开 0 毫秒立即请求 Supabase，杜绝任何白屏与竞态等待。
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
      tag: t.tag || '🌟 特别策划',
      season: t.season || '',
      date: t.date || '2026.08',
      coverImage: t.cover_image || t.coverImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85',
      curator: t.curator || '陈昨 & 想吃梨教研组',
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
      tag: String(t.tag || '🌟 特别策划'),
      date: String(t.date || '2026.08'),
      intro: String(t.introSummary || t.intro || ''),
      curator_note: Array.isArray(t.curatorStatement) ? t.curatorStatement.join('\n\n') : String(t.curatorStatement || t.curator_note || ''),
      artwork_ids: rawIds,
      is_in_hero: Boolean(t.isInHero !== false),
      hero_order: parseInt(t.heroOrder || t.hero_order || 1)
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
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (!res.ok) {
        console.error('❌ Supabase getArtworks HTTP 失败:', res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      const list = (data || []).map(item => this._fromDbArtwork(item)).filter(Boolean);
      console.log('🖼️ 成功直连 Supabase 拉取画作:', list.length, '件');
      return list;
    } catch (e) {
      console.error('❌ getArtworks 网络异常:', e);
      return [];
    }
  }

  async createArtwork(artData) {
    const payload = this._toDbArtwork(artData);
    console.log('☁️ 正在原生写入 Supabase:', payload.title);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks`, {
      method: 'POST',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('❌ 写入 Supabase 失败:', res.status, errText);
      if (window.showToast) window.showToast(`❌ 云端保存失败: ${errText}`);
      throw new Error(errText);
    }
    const data = await res.json();
    if (window.showToast) window.showToast(`☁️ 成功存入 Supabase 云端数据库！`);
    return this._fromDbArtwork(Array.isArray(data) ? data[0] : data);
  }

  async updateArtwork(artData) {
    const payload = this._toDbArtwork(artData);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks?id=eq.${encodeURIComponent(payload.id)}`, {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('❌ 更新 Supabase 失败:', res.status, errText);
      if (window.showToast) window.showToast(`❌ 云端更新失败: ${errText}`);
      throw new Error(errText);
    }
    const data = await res.json();
    if (window.showToast) window.showToast(`☁️ 云端数据库已同步更新！`);
    return this._fromDbArtwork(Array.isArray(data) ? data[0] : data);
  }

  async deleteArtwork(artId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks?id=eq.${encodeURIComponent(artId)}`, {
      method: 'DELETE',
      headers: REST_HEADERS
    });
    return res.ok;
  }

  // =========================================================================
  // 2. 小艺术家名人堂 (Students REST API)
  // =========================================================================
  async getStudents() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list = (data || []).map(item => this._fromDbStudent(item)).filter(Boolean);
      console.log('👑 成功直连 Supabase 拉取小艺术家:', list.length, '位');
      return list;
    } catch (e) {
      return [];
    }
  }

  async createStudent(studentData) {
    const payload = this._toDbStudent(studentData);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
      method: 'POST',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return this._fromDbStudent(Array.isArray(data) ? data[0] : data);
  }

  async updateStudent(studentData) {
    const payload = this._toDbStudent(studentData);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${encodeURIComponent(payload.id)}`, {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return this._fromDbStudent(Array.isArray(data) ? data[0] : data);
  }

  async deleteStudent(studentId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
      headers: REST_HEADERS
    });
    return res.ok;
  }

  // =========================================================================
  // 3. 主题特展 (Thematic Exhibitions REST API)
  // =========================================================================
  async getThematicExhibitions() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?select=*&order=hero_order.asc`, {
        method: 'GET',
        headers: REST_HEADERS
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map(item => this._fromDbTheme(item)).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  async createThematicExhibition(themeData) {
    const payload = this._toDbTheme(themeData);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions`, {
      method: 'POST',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return this._fromDbTheme(Array.isArray(data) ? data[0] : data);
  }

  async updateThematicExhibition(themeData) {
    const payload = this._toDbTheme(themeData);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(payload.id)}`, {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return this._fromDbTheme(Array.isArray(data) ? data[0] : data);
  }

  async deleteThematicExhibition(themeId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(themeId)}`, {
      method: 'DELETE',
      headers: REST_HEADERS
    });
    return res.ok;
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
      return (data || []).map(item => this._fromDbNote(item)).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  async createStickyNote(noteData) {
    const payload = this._toDbNote(noteData);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes`, {
      method: 'POST',
      headers: REST_HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return this._fromDbNote(Array.isArray(data) ? data[0] : data);
  }

  async likeStickyNote(noteId) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_note_likes`, {
        method: 'POST',
        headers: REST_HEADERS,
        body: JSON.stringify({ row_id: String(noteId) })
      });
    } catch (e) {}
  }

  async deleteStickyNote(noteId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sticky_notes?id=eq.${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
      headers: REST_HEADERS
    });
    return res.ok;
  }
}

// 导出全局单例
window.galleryCloud = new NativeSupabaseService();
