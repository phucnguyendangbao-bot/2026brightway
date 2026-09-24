/* ════════════════════════════════════════════════════════
   HOLLAND MINI — Preview 6 nhóm + 4 câu hỏi mini-quiz
   Render trong tab Holland của careers-holland.html
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const TYPES = {
    R: { name: 'Thực tế', emoji: '🔧', color: '#f59e0b', desc: 'Thích làm việc với tay, máy móc, vật thể cụ thể.' },
    I: { name: 'Nghiên cứu', emoji: '🔬', color: '#6366f1', desc: 'Thích phân tích, khám phá, giải quyết vấn đề phức tạp.' },
    A: { name: 'Nghệ thuật', emoji: '🎨', color: '#ec4899', desc: 'Sáng tạo, biểu đạt phong phú, thích tự do.' },
    S: { name: 'Xã hội', emoji: '🤝', color: '#10b981', desc: 'Yêu giao tiếp, giúp đỡ, làm việc với mọi người.' },
    E: { name: 'Lãnh đạo', emoji: '🚀', color: '#f97316', desc: 'Tư duy kinh doanh, thuyết phục, muốn dẫn dắt.' },
    C: { name: 'Quy củ', emoji: '📊', color: '#3b82f6', desc: 'Thích trật tự, chi tiết, làm việc với dữ liệu.' }
  };

  const MINI_Q = [
    { t: 'R', q: 'Tôi thích sửa chữa hoặc lắp ráp đồ vật bằng tay.' },
    { t: 'I', q: 'Tôi thích giải những bài toán khó và câu đố logic.' },
    { t: 'A', q: 'Tôi thường nghĩ ra những ý tưởng độc đáo, khác biệt.' },
    { t: 'S', q: 'Tôi thích giúp đỡ và hướng dẫn người khác học.' }
  ];

  function render() {
    const grid = document.getElementById('typesGrid');
    if (grid) {
      grid.innerHTML = Object.entries(TYPES).map(([k, t]) => `
        <div class="type-card" style="border-top: 4px solid ${t.color};">
          <span class="emoji">${t.emoji}</span>
          <div class="code">${k}</div>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
        </div>
      `).join('');
    }

    const wrap = document.getElementById('hollandMini');
    if (!wrap) return;
    wrap.innerHTML = `
      <div style="background: rgba(255,255,255,0.92); border: 1.5px solid rgba(99,102,241,0.10); border-radius: 20px; padding: 24px;">
        <h3 style="font-family: 'Quicksand', sans-serif; font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 6px;">
          🎯 Thử nhanh 4 câu (xem trước)
        </h3>
        <p style="font-size: 13px; color: var(--text-soft); margin-bottom: 18px;">
          Trả lời 4 câu sau để có cảm nhận ban đầu. Làm đầy đủ 42 câu để có kết quả chính xác.
        </p>
        <div id="miniQList" style="display: flex; flex-direction: column; gap: 18px;"></div>
      </div>
    `;

    const list = document.getElementById('miniQList');
    MINI_Q.forEach((q, i) => {
      const card = document.createElement('div');
      card.style.cssText = 'padding: 16px; background: rgba(99,102,241,0.03); border: 1.5px solid rgba(99,102,241,0.08); border-radius: 14px;';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 800; color: var(--primary); letter-spacing: 0.08em; text-transform: uppercase;">CÂU ${i + 1}/4</span>
          <span style="display: inline-block; background: ${TYPES[q.t].color}22; border: 1px solid ${TYPES[q.t].color}; color: ${TYPES[q.t].color}; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 700;">
            ${TYPES[q.t].emoji} ${TYPES[q.t].name}
          </span>
        </div>
        <div style="font-family: 'Quicksand', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); line-height: 1.4; margin-bottom: 12px;">
          ${q.q}
        </div>
        <div style="display: flex; gap: 8px; justify-content: center;">
          ${[1,2,3,4,5].map(n => `
            <button data-i="${i}" data-v="${n}" class="mini-btn"
                    style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; cursor: pointer; font-size: 14px; font-weight: 800; color: #64748b; font-family: 'Quicksand', sans-serif; transition: all .2s;">
              ${n}
            </button>
          `).join('')}
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i);
        list.querySelectorAll(`.mini-btn[data-i="${i}"]`).forEach(b => {
          b.style.background = '#fff';
          b.style.borderColor = '#d1d5db';
          b.style.color = '#64748b';
          b.style.transform = 'scale(1)';
        });
        btn.style.background = 'linear-gradient(135deg, #6366f1, #818cf8)';
        btn.style.borderColor = '#6366f1';
        btn.style.color = '#fff';
        btn.style.transform = 'scale(1.1)';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
