export const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
/** Map accent-insensitive matches back to original grapheme boundaries. */
export function highlightRanges(text: string, query: string): [number, number][] {
  const needle = normalizeText(query.trim());
  if (!needle) return [];
  const map: { start: number; end: number }[] = [];
  let normalized = '';
  for (const part of new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(text)) {
    const value = normalizeText(part.segment);
    normalized += value;
    for (let n = 0; n < value.length; n++)
      map.push({ start: part.index, end: part.index + part.segment.length });
  }
  const result: [number, number][] = [];
  let from = 0;
  while (from < normalized.length) {
    const start = normalized.indexOf(needle, from);
    if (start < 0) break;
    result.push([map[start].start, map[start + needle.length - 1].end]);
    from = start + needle.length;
  }
  return result;
}
