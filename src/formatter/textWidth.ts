/**
 * 计算字符串在 VS Code/Monaco 中更接近的“可见列数”。
 * - 全角（CJK/全角空格/全角标点等）通常占 2 列
 * - 组合字符/变体选择符/ZWJ 等通常不额外占列
 * - \t 按 tab stop 计算（默认 tabSize=4）
 */
const isCombiningOrZeroWidth = (codePoint: number): boolean => {
  // Combining Diacritical Marks + extensions
  if (codePoint >= 0x0300 && codePoint <= 0x036f) { return true; }
  if (codePoint >= 0x1ab0 && codePoint <= 0x1aff) { return true; }
  if (codePoint >= 0x1dc0 && codePoint <= 0x1dff) { return true; }
  if (codePoint >= 0x20d0 && codePoint <= 0x20ff) { return true; }
  if (codePoint >= 0xfe20 && codePoint <= 0xfe2f) { return true; }

  // Variation Selectors
  if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) { return true; }
  if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) { return true; }

  // Zero-width joiner / non-joiner
  if (codePoint === 0x200d || codePoint === 0x200c) { return true; }

  // Soft hyphen (usually not rendered)
  if (codePoint === 0x00ad) { return true; }

  return false;
};

const isFullWidthCodePoint = (codePoint: number): boolean => {
  // A pragmatic approximation of East Asian Wide/FullWidth characters.
  // This intentionally treats most CJK as fullwidth (2 columns).
  if (codePoint >= 0x1100 && (
    codePoint <= 0x115f ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  )) {
    return true;
  }
  return false;
};

const charColumns = (ch: string, currentColumn: number, tabSize: number): number => {
  if (!ch) { return 0; }
  if (ch === '\t') {
    const size = Math.max(1, Number(tabSize || 4));
    const offset = currentColumn % size;
    return offset === 0 ? size : (size - offset);
  }

  const cp = ch.codePointAt(0) ?? 0;
  if (isCombiningOrZeroWidth(cp)) { return 0; }
  return isFullWidthCodePoint(cp) ? 2 : 1;
};

export const stringVSCodeColumns = (s: string, tabSize = 4): number => {
  const text = s || '';
  let cols = 0;
  for (const ch of text) {
    cols += charColumns(ch, cols, tabSize);
  }
  return cols;
};

/**
 * 按“可见列数”拆分字符串，保证每段列数 <= maxColumns。
 * 注意：用 for..of 按 code point 迭代，避免把 surrogate pair 切开。
 */
export const splitByVSCodeColumns = (s: string, maxColumns: number, tabSize = 4): string[] => {
  const limit = Number(maxColumns || 0);
  if (!limit || limit <= 0) { return [s]; }
  if (stringVSCodeColumns(s, tabSize) <= limit) { return [s]; }

  const out: string[] = [];
  let cur = '';
  let curCols = 0;

  for (const ch of (s || '')) {
    const add = charColumns(ch, curCols, tabSize);

    // 如果当前段不为空且加入后会超限，则先切一段。
    if (cur && curCols + add > limit) {
      out.push(cur);
      cur = '';
      curCols = 0;
    }

    cur += ch;
    curCols += add;
  }

  if (cur) { out.push(cur); }
  return out;
};
