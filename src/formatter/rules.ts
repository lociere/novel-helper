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
