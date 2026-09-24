/* ════════════════════════════════════════════════════════
   SYNC — Cloud sync cho favorites + search history + essays
   Tự động fallback localStorage nếu chưa đăng nhập
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEYS = {
    fav: 'bw_favorites',
    history: 'bw_history',
    essays: 'bw_essays'
  };

  // ─── Local fallback ───
  function localGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function localSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  async function sb() {
    return window.getSupabase();
  }

  // ─── Favorites ───
  async function toggleFavorite(job) {
    if (!window.BWAuth.isSignedIn()) {
      const favs = localGet(KEYS.fav);
      const idx = favs.findIndex(j => j.name === job.name);
      if (idx >= 0) {
        favs.splice(idx, 1);
        localSet(KEYS.fav, favs);
        return { saved: false, source: 'local' };
      }
      favs.unshift({
        name: job.name,
        en: job.en,
        code: job.code,
        group: job.group,
        salary: job.salary,
        outlook: job.outlook,
        savedAt: new Date().toISOString()
      });
      localSet(KEYS.fav, favs);
      return { saved: true, source: 'local' };
    }

    const user = window.BWAuth.getUser();
    const client = await sb();

    const { data: existing } = await client
      .from('favorite_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_name', job.name)
      .maybeSingle();

    if (existing) {
      await client.from('favorite_jobs').delete().eq('id', existing.id);
      return { saved: false, source: 'cloud' };
    }

    await client.from('favorite_jobs').insert({
      user_id: user.id,
      job_name: job.name,
      job_data: job
    });
    return { saved: true, source: 'cloud' };
  }

  async function listFavorites() {
    if (!window.BWAuth.isSignedIn()) {
      return localGet(KEYS.fav).map(j => ({
        job_name: j.name,
        job_data: j,
        created_at: j.savedAt
      }));
    }
    const user = window.BWAuth.getUser();
    const client = await sb();
    const { data, error } = await client
      .from('favorite_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function isFavorited(jobName) {
    if (!window.BWAuth.isSignedIn()) {
      return localGet(KEYS.fav).some(j => j.name === jobName);
    }
    const user = window.BWAuth.getUser();
    const client = await sb();
    const { data } = await client
      .from('favorite_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_name', jobName)
      .maybeSingle();
    return !!data;
  }

  // ─── Search history ───
  async function logSearch(query, holland, count) {
    // Always local first (cheap)
    const history = localGet(KEYS.history);
    history.unshift({
      query,
      holland: holland || 'all',
      count: count || 0,
      at: new Date().toISOString()
    });
    // Keep last 50
    localSet(KEYS.history, history.slice(0, 50));

    if (!window.BWAuth.isSignedIn()) return { saved: 'local' };

    const user = window.BWAuth.getUser();
    const client = await sb();
    await client.from('search_history').insert({
      user_id: user.id,
      query,
      filter_holland: holland || 'all',
      results_count: count || 0
    });
    return { saved: 'cloud' };
  }

  async function listHistory(limit = 30) {
    if (!window.BWAuth.isSignedIn()) {
      return localGet(KEYS.history).slice(0, limit).map(h => ({
        query: h.query,
        filter_holland: h.holland,
        results_count: h.count,
        created_at: h.at
      }));
    }
    const user = window.BWAuth.getUser();
    const client = await sb();
    const { data, error } = await client
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  // ─── Essays ───
  async function saveEssay(essay) {
    const payload = {
      ...essay,
      word_count: (essay.content || '').trim().split(/\s+/).length
    };

    if (!window.BWAuth.isSignedIn()) {
      const list = localGet(KEYS.essays);
      const idx = list.findIndex(e => e.id === essay.id);
      const id = essay.id || ('local-' + Date.now());
      const stored = { ...payload, id, updated_at: new Date().toISOString() };
      if (idx >= 0) list[idx] = stored;
      else list.unshift(stored);
      localSet(KEYS.essays, list);
      return { ...stored, source: 'local' };
    }

    const user = window.BWAuth.getUser();
    const client = await sb();
    if (essay.id && essay.id.startsWith('local-')) {
      delete essay.id;
    }
    const row = { ...payload, user_id: user.id };
    if (essay.id) {
      const { data, error } = await client
        .from('essays')
        .update(row)
        .eq('id', essay.id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, source: 'cloud' };
    } else {
      const { data, error } = await client
        .from('essays')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return { ...data, source: 'cloud' };
    }
  }

  async function listEssays() {
    if (!window.BWAuth.isSignedIn()) {
      return localGet(KEYS.essays);
    }
    const user = window.BWAuth.getUser();
    const client = await sb();
    const { data, error } = await client
      .from('essays')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function deleteEssay(id) {
    if (!window.BWAuth.isSignedIn()) {
      const list = localGet(KEYS.essays).filter(e => e.id !== id);
      localSet(KEYS.essays, list);
      return { deleted: true, source: 'local' };
    }
    const user = window.BWAuth.getUser();
    const client = await sb();
    const { error } = await client
      .from('essays')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    return { deleted: true, source: 'cloud' };
  }

  // ─── Merge local -> cloud on first sign-in ───
  async function syncLocalToCloud() {
    if (!window.BWAuth.isSignedIn()) return;
    const user = window.BWAuth.getUser();
    const client = await sb();

    // favorites
    const localFav = localGet(KEYS.fav);
    for (const j of localFav) {
      const { data: exists } = await client
        .from('favorite_jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_name', j.name)
        .maybeSingle();
      if (!exists) {
        await client.from('favorite_jobs').insert({
          user_id: user.id,
          job_name: j.name,
          job_data: j
        });
      }
    }

    // essays
    const localEss = localGet(KEYS.essays);
    for (const e of localEss) {
      const { id, ...rest } = e;
      await client.from('essays').insert({
        user_id: user.id,
        title: rest.title,
        content: rest.content,
        prompt: rest.prompt,
        word_count: rest.word_count
      });
    }

    // clear local after sync
    localStorage.removeItem(KEYS.fav);
    localStorage.removeItem(KEYS.essays);
  }

  // Expose
  window.BWSync = {
    toggleFavorite, listFavorites, isFavorited,
    logSearch, listHistory,
    saveEssay, listEssays, deleteEssay,
    syncLocalToCloud
  };
})();
