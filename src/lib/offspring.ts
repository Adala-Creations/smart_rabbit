export function validateSexingCounts(totalCount: number, maleCount?: number|null, femaleCount?: number|null) {
  const m = maleCount !== undefined && maleCount !== null ? Number(maleCount) : null;
  const f = femaleCount !== undefined && femaleCount !== null ? Number(femaleCount) : null;
  if (m === null || f === null) return false;
  if (!Number.isInteger(m) || !Number.isInteger(f)) return false;
  if (m < 0 || f < 0) return false;
  return m + f === Number(totalCount);
}

export default validateSexingCounts;
