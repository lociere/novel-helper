/**
 * 文本排版规则（跨模块复用）。
 *
 * 说明：这里的规则用于“哪些行/段落不参与 Novel Helper 的排版/缩进”。
 */

const DEFAULT_SKIP_FORMAT_LINE_PREFIXES = ['#'];

/**
 * 判断某行是否应跳过格式化（原样保留）。
 * 目前用于 Markdown 标题等语法行。
 */
export const shouldSkipFormatLine = (line: string): boolean => {
  const trimmedLeft = line.trimStart();
  if (!trimmedLeft) { return false; }
  return DEFAULT_SKIP_FORMAT_LINE_PREFIXES.some(p => trimmedLeft.startsWith(p));
};
