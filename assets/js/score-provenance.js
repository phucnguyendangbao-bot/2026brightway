// Presentation gate only. Never changes the stored cutoff or admissions formula.
export function canDisplayProgramScores(details, year = 2026) {
  return Number(details?.year) === Number(year)
    && /^https:\/\//.test(String(details?.scoreSource || ''))
    && Number.isFinite(details?.scoreScale)
    && details.scoreScale > 0
    && Boolean(String(details?.scoreMethod || '').trim())
    && !/cần đối chiếu|chưa xác minh|chưa rõ phương thức|dự kiến/i.test(details.scoreMethod);
}
