/**
 * Prompt templates cho /api/analyze.
 * ────────────────────────────────────────────────────────────
 * Tách khỏi frontend để:
 *  - Ngăn user sửa system prompt gửi lên.
 *  - Bảo vệ IP: prompt chi tiết không bị lộ qua DevTools.
 *  - Chuẩn hoá cách build request giữa các client.
 *
 * Quy ước:
 *  - Mỗi type có một SYSTEM_PROMPT riêng (đặt vai trò + quy tắc chấm).
 *  - USER message build từ {content, options}, có truncate an toàn.
 *  - max_tokens được khoá cứng theo type.
 */

export const MAX_TOKENS_BY_TYPE = {
  portfolio: 2048,
  essay: 3072,
  outline: 3000,
};

export const ALLOWED_TYPES = Object.keys(MAX_TOKENS_BY_TYPE);

export const CONTENT_LIMITS = {
  portfolio: 1500,
  essay: 4500,
  outline: 4000,
};

/* ════════════════════════════════════════════════════════════
   SYSTEM PROMPTS — copy nguyên văn từ frontend cũ
   ════════════════════════════════════════════════════════════ */

const SYSTEM_PORTFOLIO = `Bạn là chuyên gia đánh giá portfolio học bổng quốc tế. Trả lời CHỈ bằng JSON thuần, KHÔNG markdown, KHÔNG giải thích thêm.`;

const SYSTEM_ESSAY = `Bạn là chuyên gia hội đồng học bổng quốc tế (Fulbright / Chevening / DAAD). Phân tích bài luận học bổng theo framework 6 phần & rubric 7 trục. Trả lời CHỈ bằng JSON thuần, KHÔNG markdown, KHÔNG giải thích thêm.`;

const SYSTEM_OUTLINE = `Bạn là chuyên gia tư vấn học bổng tại Việt Nam. Dựa trên hồ sơ học sinh và tiêu chí của trường, hãy tạo DÀN Ý BÀI LUẬN HỌC BỔNG cá nhân hóa và phân tích điểm mạnh/yếu của hồ sơ. Trả lời CHỈ bằng JSON thuần, KHÔNG markdown, KHÔNG giải thích thêm.`;

export const SYSTEM_PROMPTS = {
  portfolio: SYSTEM_PORTFOLIO,
  essay: SYSTEM_ESSAY,
  outline: SYSTEM_OUTLINE,
};

/* ════════════════════════════════════════════════════════════
   USER TEMPLATES — chỉ chèn dữ liệu đã được whitelist
   ════════════════════════════════════════════════════════════ */

function safeStr(v, fallback = '') {
  if (typeof v !== 'string') return fallback;
  // Loại bỏ backtick để tránh phá vỡ template string khi render log
  return v.replace(/```/g, "'''");
}

function joinList(arr, max = 12) {
  if (!Array.isArray(arr)) return '';
  return arr
    .filter(x => typeof x === 'string' && x.trim().length > 0)
    .slice(0, max)
    .map(s => s.trim())
    .join(', ');
}

function buildPortfolioPrompt({ content, options }) {
  const opts = joinList(options?.criteria, 12) || 'Đánh giá tổng quan';
  const truncated = safeStr(content).slice(0, CONTENT_LIMITS.portfolio);
  return `Chuyên gia học bổng. Phân tích portfolio theo tiêu chí: ${opts}.

Portfolio:
"""
${truncated}
"""

Trả về JSON thuần (KHÔNG markdown, KHÔNG giải thích thêm):
{"score":75,"level":"Khá","verdict":"Nhận xét ngắn 1 câu.","rubric":{"leadership":70,"impact":75,"clarity":80,"storytelling":65,"scholarshipFit":78},"blocks":[{"icon":"📊","title":"Tên tiêu chí","status":"warn","badge":"Khá","goods":["điểm tốt ngắn"],"bads":["điểm yếu ngắn"],"tips":["gợi ý ngắn"],"rewrite":""}]}

Quy tắc NGHIÊM NGẶT:
- rubric: chấm 5 trục từ 0-100, đánh giá khắt khe theo chuẩn hội đồng học bổng quốc tế
- Mỗi block: tối đa 1 good, 1 bad, 1 tip. Mỗi cái tối đa 10 từ.
- verdict tối đa 15 từ
- rewrite để trống "" trừ khi tiêu chí "Gợi ý cải thiện cụ thể" được chọn (tối đa 20 từ)
- JSON phải hoàn chỉnh từ { đến }`;
}

function buildEssayPrompt({ content, options }) {
  const opts = joinList(options?.criteria, 12) || 'Đánh giá tổng quan';
  const t = options?.type || {};
  const label = safeStr(t.label, 'Tổng quát');
  const min = Number.isFinite(t.min) ? t.min : 0;
  const max = Number.isFinite(t.max) ? t.max : 0;
  const words = Number.isFinite(options?.words) ? options.words : 0;
  const truncated = safeStr(content).slice(0, CONTENT_LIMITS.essay);
  return `Bạn là chuyên gia hội đồng học bổng quốc tế (Fulbright / Chevenng / DAAD). Phân tích bài luận học bổng theo framework 6 phần & rubric 7 trục.

LOẠI HỌC BỔNG: ${label} (chuẩn ${min}–${max} từ, bài hiện tại ${words} từ)
TIÊU CHÍ ĐÁNH GIÁ: ${opts}

BÀI LUẬN:
"""
${truncated}
"""

Trả về JSON thuần (KHÔNG markdown, KHÔNG giải thích thêm):
{"score":75,"level":"Khá","verdict":"Nhận xét tổng 1 câu dưới 20 từ.","rubric":{"structure":72,"clarity":78,"evidence":60,"personalStory":80,"vision":70,"scholarshipFit":75,"language":82},"sections":[{"icon":"📝","title":"Mở bài (Intro)","status":"warn","badge":"Ổn","goods":["điểm tốt ngắn"],"bads":["điểm yếu ngắn"],"tips":["gợi ý ngắn"],"rewrite":""},{"icon":"📖","title":"Background","status":"ok","badge":"Tốt","goods":[],"bads":[],"tips":[],"rewrite":""},{"icon":"📊","title":"Achievements","status":"danger","badge":"Yếu","goods":[],"bads":[],"tips":[],"rewrite":""},{"icon":"🔭","title":"Vision","status":"warn","badge":"Ổn","goods":[],"bads":[],"tips":[],"rewrite":""},{"icon":"🎓","title":"Why Scholarship","status":"ok","badge":"Tốt","goods":[],"bads":[],"tips":[],"rewrite":""},{"icon":"✨","title":"Kết luận","status":"ok","badge":"Tốt","goods":[],"bads":[],"tips":[],"rewrite":""}],"errors":["Lỗi 1 phát hiện được (nếu có)","Lỗi 2"],"wordCheck":"Đạt chuẩn ${min}–${max} từ"}

QUY TẮC NGHIÊM NGẶT:
- rubric: chấm 7 trục 0-100. Tính score tổng = structure*0.1 + clarity*0.1 + evidence*0.2 + personalStory*0.15 + vision*0.15 + scholarshipFit*0.2 + language*0.1 (làm tròn).
- level: "Xuất sắc" (85+) / "Khá" (70-84) / "Trung bình" (55-69) / "Yếu" (<55).
- sections: ĐÚNG 6 phần theo thứ tự: Mở bài, Background, Achievements, Vision, Why Scholarship, Kết luận. Nếu bài không có phần nào → status="danger", bad="Thiếu phần này".
- Mỗi section: tối đa 2 goods, 2 bads, 2 tips. Mỗi câu ≤ 15 từ.
- rewrite: chỉ điền nếu tiêu chí "Gợi ý viết lại cụ thể" được chọn; đoạn viết lại ≤ 40 từ, có số liệu cụ thể.
- errors: phát hiện lỗi từ list: [kể lể dài dòng / thiếu số liệu / viết chung chung / thiếu mục tiêu rõ / không liên kết với học bổng / văn phong AI / không có insight cá nhân / dùng "tôi cần tiền"]. Tối đa 4 lỗi, chỉ list lỗi thực sự có.
- wordCheck: đánh giá ngắn về độ dài so với chuẩn (1 câu).
- verdict: ≤ 20 từ, nói thẳng điểm mạnh nhất hoặc yếu nhất.
- JSON phải hoàn chỉnh từ { đến }.`;
}

function buildOutlinePrompt({ content, options }) {
  const o = options?.student || {};
  const school = options?.school || {};
  const truncated = safeStr(content).slice(0, CONTENT_LIMITS.outline);
  return `Bạn là chuyên gia tư vấn học bổng tại Việt Nam. Dựa trên hồ sơ học sinh và tiêu chí của trường, hãy tạo DÀN Ý BÀI LUẬN HỌC BỔNG cá nhân hóa và phân tích điểm mạnh/yếu của hồ sơ.

TRƯỜNG APPLY: ${safeStr(school.name, 'Chưa cung cấp')}
TIÊU CHÍ HỌC BỔNG: ${safeStr(school.criteria, 'Chưa cung cấp')}
TRỌNG TÂM HỘI ĐỒNG: ${safeStr(school.focus, 'Chưa cung cấp')}

HỒ SƠ HỌC SINH:
- Điểm THPT: ${safeStr(o.thpt, 'Chưa cung cấp')}
- GPA học bạ: ${safeStr(o.gpa, 'Chưa cung cấp')}
- Ngoại ngữ: ${safeStr(o.english, 'Chưa cung cấp')}
- Ngành mục tiêu: ${safeStr(o.major, 'Chưa cung cấp')}
- Giải thưởng / Thành tích: ${safeStr(o.awards, 'Chưa cung cấp')}
- Hoạt động ngoại khóa / Dự án: ${safeStr(o.activities, 'Chưa cung cấp')}
- Câu chuyện / Khó khăn: ${safeStr(o.story, 'Chưa cung cấp')}
- Vision / Mục tiêu: ${safeStr(o.vision, 'Chưa cung cấp')}

BÀI LUẬN HIỆN TẠI (nếu có):
"""
${truncated}
"""

Trả về JSON thuần (KHÔNG markdown, KHÔNG giải thích thêm) theo schema đã định.`;
}

/* ════════════════════════════════════════════════════════════
   Public API
   ════════════════════════════════════════════════════════════ */

const BUILDERS = {
  portfolio: buildPortfolioPrompt,
  essay: buildEssayPrompt,
  outline: buildOutlinePrompt,
};

/**
 * @param {{type: string, content: string, options?: object}} input
 * @returns {{system: string, userMessage: string, maxTokens: number, model: string}}
 */
export function buildRequest(input) {
  const type = input?.type;
  const builder = BUILDERS[type];
  if (!builder) {
    throw Object.assign(new Error(`Invalid type: ${type}`), { status: 400 });
  }

  const content = typeof input?.content === 'string' ? input.content : '';
  const options = (input && typeof input.options === 'object' && input.options) || {};

  return {
    system: SYSTEM_PROMPTS[type],
    userMessage: builder({ content, options }),
    maxTokens: MAX_TOKENS_BY_TYPE[type],
    model: 'claude-sonnet-4-20250514',
  };
}
