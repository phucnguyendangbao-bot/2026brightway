/* ════════════════════════════════════════════════════════
   CMS SERVICE — quản lý bài viết + ngành nghề
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const TABLES = {
    posts: 'posts',
    majors: 'majors',
    profiles: 'profiles',
    tags: 'tags',
    postTags: 'post_tags'
  };

  // ============ POSTS ============
  async function listPublishedPosts({ limit = 20, offset = 0, category = null, search = null } = {}) {
    const sb = await window.getSupabase();
    let q = sb
      .from(TABLES.posts)
      .select(`
        id, slug, title, summary, cover_image, category, status,
        published_at, views_count, created_at,
        author:profiles!posts_author_id_fkey ( id, full_name, avatar_url )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) q = q.eq('category', category);
    if (search) q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function getPostBySlug(slug) {
    const sb = await window.getSupabase();
    const { data, error } = await sb
      .from(TABLES.posts)
      .select(`
        *,
        author:profiles!posts_author_id_fkey ( id, full_name, avatar_url, school, subject )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    if (error) throw error;

    // Tăng views
    if (data) {
      await sb
        .from(TABLES.posts)
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id);
    }

    return data;
  }

  async function createPost(payload) {
    const sb = await window.getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const row = {
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary || '',
      content: payload.content || '',
      cover_image: payload.cover_image || null,
      category: payload.category || 'chia_se',
      author_id: user.id,
      status: payload.status || 'draft',
      published_at: payload.status === 'published' ? new Date().toISOString() : null
    };

    const { data, error } = await sb.from(TABLES.posts).insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function updatePost(id, payload) {
    const sb = await window.getSupabase();
    const update = { ...payload };
    if (payload.status === 'published' && !payload.published_at) {
      update.published_at = new Date().toISOString();
    }
    delete update.id;
    delete update.author_id;

    const { data, error } = await sb.from(TABLES.posts).update(update).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deletePost(id) {
    const sb = await window.getSupabase();
    const { error } = await sb.from(TABLES.posts).delete().eq('id', id);
    if (error) throw error;
  }

  // ============ MAJORS ============
  async function listMajors({ category = null, search = null } = {}) {
    const sb = await window.getSupabase();
    let q = sb
      .from(TABLES.majors)
      .select('*')
      .order('name_vi', { ascending: true });

    if (category) q = q.eq('category', category);
    if (search) q = q.or(`name_vi.ilike.%${search}%,name_en.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function getMajorBySlug(slug) {
    const sb = await window.getSupabase();
    const { data, error } = await sb
      .from(TABLES.majors)
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;

    if (data) {
      await sb
        .from(TABLES.majors)
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id);
    }
    return data;
  }

  async function createMajor(payload) {
    const sb = await window.getSupabase();
    const { data, error } = await sb.from(TABLES.majors).insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function updateMajor(id, payload) {
    const sb = await window.getSupabase();
    const { data, error } = await sb.from(TABLES.majors).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteMajor(id) {
    const sb = await window.getSupabase();
    const { error } = await sb.from(TABLES.majors).delete().eq('id', id);
    if (error) throw error;
  }

  // ============ PROFILE / ROLE ============
  async function getMyProfile() {
    const sb = await window.getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb
      .from(TABLES.profiles)
      .select('*')
      .eq('id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async function isAdmin() {
    const profile = await getMyProfile();
    return profile && profile.role === 'admin';
  }

  async function isTeacherOrAdmin() {
    const profile = await getMyProfile();
    return profile && ['admin', 'teacher'].includes(profile.role);
  }

  // ============ HELPERS ============
  function slugify(str) {
    return String(str)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function categoryLabel(cat) {
    const map = {
      khoi_thpt: 'Khối THPT',
      tu_van: 'Tư vấn',
      su_kien: 'Sự kiện',
      chia_se: 'Chia sẻ',
      nganh_hoc: 'Ngành học',
      khoi_A: 'Khối A (Toán, Lý, Hóa)',
      khoi_B: 'Khối B (Toán, Hóa, Sinh)',
      khoi_C: 'Khối C (Văn, Sử, Địa)',
      khoi_D: 'Khối D (Ngoại ngữ)',
      khoi_khac: 'Khối khác'
    };
    return map[cat] || cat;
  }

  // Export
  window.CMS = {
    TABLES,
    listPublishedPosts, getPostBySlug, createPost, updatePost, deletePost,
    listMajors, getMajorBySlug, createMajor, updateMajor, deleteMajor,
    getMyProfile, isAdmin, isTeacherOrAdmin,
    slugify, formatDate, categoryLabel
  };
})();
