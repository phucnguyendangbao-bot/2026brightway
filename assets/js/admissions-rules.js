// Only checks the raw-score component in Article 6.3; it never decides admission.
export function rawThreshold(values, comboKeys) {
  const valid = key => Number.isFinite(values[key]) && values[key] >= 0 && values[key] <= 10;
  const sums = [];
  if (comboKeys.every(valid)) sums.push(comboKeys.reduce((sum, key) => sum + values[key], 0));
  if (valid('math') && valid('lit')) {
    for (const key of Object.keys(values)) {
      if (key !== 'math' && key !== 'lit' && valid(key)) sums.push(values.math + values.lit + values[key]);
    }
  }
  const best = sums.length ? Math.max(...sums) : null;
  return { best, meets: best !== null && best >= 15 };
}
export function rawThresholdText(result) {
  const assessment = rawThreshold(result.values, result.keys);
  if (assessment.meets) return 'Điểm thi gốc đã nhập có tổng 3 môn đạt mức 15/30 (theo tổ hợp hoặc Toán + Văn + một môn khác). Vẫn phải kiểm tra đối tượng, ngành và các điều kiện riêng.';
  return 'Chưa xác nhận ngưỡng nguồn tuyển 15/30 từ điểm thi đã nhập. Có thể cần thêm Toán, Văn và môn khác; trường hợp ngoại lệ xem Điều 6 khoản 3. Kết quả này không kết luận đủ điều kiện hay trúng tuyển.';
}
