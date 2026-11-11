# BrightWay school data research brief (tuyển sinh 2026)

You are filling gaps in a Vietnamese university comparison table for grade-12 students.
Today is 2026-11-11. The 2026 admissions cycle is over: 2026 cut-off scores (điểm chuẩn/điểm trúng tuyển) were
published around August 2026, tuition for academic year 2026–2027 is published, đề án tuyển sinh 2026 exists.

For EACH school assigned to you, find these fields (only the ones listed in `missing` for that school in
context.json are required, but also fill `programs`/`scores` if you find them cheaply):

1. website   – official homepage of the university (https).
2. tuition   – học phí 2026–2027 (or "áp dụng cho khóa tuyển sinh 2026"). Short Vietnamese summary with real numbers,
               e.g. "Khoảng 15,5–18,5 triệu đồng/năm học (chương trình chuẩn); chương trình tiên tiến 40 triệu/năm."
3. scholarships – up to 3 scholarships the school itself announced for 2026 entrants (học bổng tân sinh viên 2026,
               học bổng tuyển sinh 2026, ...). Title, one-line description with the key condition/amount.
4. admission – phương thức xét tuyển 2026: the official đề án / thông báo tuyển sinh 2026 page, and a ≤260-char
               Vietnamese summary listing the methods (e.g. "4 phương thức: xét tuyển thẳng; điểm thi THPT 2026;
               điểm ĐGNL ĐHQG-HCM 2026; học bạ kết hợp chứng chỉ quốc tế.").
5. scores    – điểm chuẩn 2026 for ONE named method (prefer "điểm thi tốt nghiệp THPT 2026"). Give the scale (30, 40, 1200…)
               and as many programs as the official table shows: code (mã xét tuyển), name, score (number).
6. programs  – danh mục ngành/mã xét tuyển 2026 (code + name). If you already listed them under scores, you may
               reuse that list.

## Source rules (strict — this data is shown to students)
- ONLY official sources: the university's own domains (incl. tuyensinh.*, admission.*, its subdomains/PDFs on them),
  the parent university system (e.g. vnuhcm.edu.vn, ud.edu.vn, hueuni.edu.vn) or the Ministry (moet.gov.vn).
  NOT tuyensinh247, thuvienphapluat, news sites, Wikipedia, forums. A news article may help you FIND the official page,
  but the `source` you record must be the official page.
- Year must be 2026 (tuition: 2026–2027). Never fill with 2025 or 2027 data. If only 2025 exists, report not found.
- Open each page you cite with WebFetch and copy numbers exactly as written. No estimates, no rounding, no invention.
- If a page is an image/PDF you cannot read, say so in `not_found` rather than guessing.
- Dates as YYYY-MM-DD when the page shows them, else null.
- Write all prose fields in natural Vietnamese, short, neutral (no marketing words).

## Output
Write ONE JSON file to the path given in your task, shaped exactly like:

{
  "batch": "<name>",
  "researched_at": "2026-11-11",
  "schools": [
    {
      "school_id": "hcmut",
      "website": "https://hcmut.edu.vn/" | null,
      "tuition": {"summary": "...", "source": "https://...", "published": "2026-06-10" | null} | null,
      "scholarships": [{"title": "...", "description": "...", "source": "https://...", "publishedAt": "2026-03-01" | null}],
      "admission": {"summary": "...", "source": "https://...", "published": "..." | null} | null,
      "scores": {"source": "https://...", "method": "Điểm thi tốt nghiệp THPT 2026 · thang 30", "scale": 30,
                 "programs": [{"code": "7480201", "name": "Công nghệ thông tin", "score": 26.5}],
                 "note": "optional: e.g. score is for tổ hợp A00; other methods differ"} | null,
      "programs": {"source": "https://...", "list": [{"code": "7480201", "name": "Công nghệ thông tin"}], "note": "..."} | null,
      "not_found": {"tuition": "why", "scores": "why"}
    }
  ]
}

Validate the file parses as JSON (e.g. `python3 -c "import json;json.load(open(PATH))"`). Keep going until every
assigned school has every required field either filled from an official 2026 source or explained in `not_found`
after a genuine search (several queries, the school's tuyển sinh site, its news section, PDFs).
Finish with a short report: per school, which fields are filled and which are not found.

## PASS 2 — read this too (it overrides anything above where they differ)
This is the second pass. Your context file lists, per school, only the fields still `missing`, plus `pass1_notes`:
why the first pass failed. Do NOT repeat a route the notes say failed; try different official routes, e.g.:
- Search with site: filters and different wording: `site:<domain> học phí 2026-2027`, `"năm học 2026-2027" học phí <tên trường>`,
  `điểm chuẩn 2026 <tên trường> filetype:pdf`, `đề án tuyển sinh 2026 <tên trường> pdf`, `học bổng tân sinh viên 2026 <tên trường>`,
  `công khai học phí 2026` / `ba công khai 2026-2027` (schools publish yearly "công khai" reports with tuition), `quyết định học phí 2026-2027`.
- Other official hosts of the same school (tuyensinh.*, ts.*, daotao.*, ctsv.*, ketoan.*, tc.*, a faculty site for a program list),
  the parent system (vnuhcm.edu.vn, udn.vn / ud.edu.vn, hueuni.edu.vn) and moet.gov.vn.
- A news article may point you to the official PDF/URL; then open that official URL and cite it.
- Text-based PDFs on official hosts usually read fine with WebFetch; try the PDF URL directly.
Do not go around a block: if WebFetch says a site is disallowed (robots) or a permission is denied, do not try caches,
mirrors, proxies or other tools for that page — record it and move on to a different official page.
If a page needs a real browser (JavaScript-only content, anti-bot cookie page, score table that is only an image, scanned
PDF), add it to a top-level array `"browser_candidates": [{"school_id","field","url","why"}]` in your output so it can be
read in a browser later. Only list URLs on official hosts that you believe hold the missing data.
Only fill the `missing` fields (website/programs may be skipped). Same JSON shape as above, plus `browser_candidates`.
Keep searching each missing field for real (at least 4 different queries/routes) before writing it into `not_found`.
