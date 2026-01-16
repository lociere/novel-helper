import { shouldSkipFormatLine } from '../utils/formatRules';
type FormatConfig = {
  paragraphIndent: number;
  overallIndent: number;
  /**
   * 段间距（段间空行数）。
   */
  lineSpacing: number;
  /**
   * 是否使用全角空格（U+3000）作为缩进单位。
   * 默认 false（半角空格）。
   */
  useFullWidthIndent?: boolean;

  /**
   * 段落识别策略：决定是否把“空行”作为段落分隔标准。
   * - anyBlankLine: 只要文档中出现过空行，就用空行分段（旧逻辑）
   * - requireAll: 只有当“所有段落边界”都有空行时，才用空行分段；否则退化为“一行一段”
   * - majority: 当大多数段落边界都有空行时，才用空行分段；否则退化为“一行一段”
   */
  paragraphSplitMode?: 'anyBlankLine' | 'requireAll' | 'majority';

  /**
   * 当某一行本身带段首缩进（看起来是新段开头）时，即使段落间没有空行，也强制从该行开始新段落。
   * 默认开启。
   */
  paragraphSplitOnIndentedLine?: boolean;
};

const normalizeMergedParagraph = (lines: string[]): string => {
  // 约定：段内多行是“人为断行”，合并时去掉前后空白并直接拼接。
  return lines
    .map(s => s.trim())
    .filter(Boolean)
    .join('');
};

export const formatText = (text: string, config: FormatConfig): string => {
  // 1) 先识别段落，再合并段内文本为单行
  // - 段落：有空行时以“空行”为分隔信号，否则默认“一行一段”
  // - 段间距：段与段之间插入 lineSpacing 个空行
  // - 幂等性：当文档已按本规则格式化时，二次格式化不会继续增加空行
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const hasBlankLine = lines.some(l => l.trim().length === 0);

  const mode = config.paragraphSplitMode ?? 'anyBlankLine';
  const splitOnIndentedLine = config.paragraphSplitOnIndentedLine !== false;

  // 统计“段落边界是否有空行”的比例，用于 requireAll/majority 模式判定
  // 边界：两个非空行之间的分隔处。
  const boundaryStats = (!hasBlankLine || mode === 'anyBlankLine')
    ? { totalBoundaries: 0, blankSeparatedBoundaries: 0 }
    : (() => {
      let totalBoundaries = 0;
      let blankSeparatedBoundaries = 0;

      let seenNonEmpty = false;
      let blankRun = 0;
      for (const line of lines) {
        const isBlank = line.trim().length === 0;
        if (isBlank) {
          if (seenNonEmpty) { blankRun++; }
          continue;
        }

        if (!seenNonEmpty) {
          seenNonEmpty = true;
          blankRun = 0;
          continue;
        }

        totalBoundaries++;
        if (blankRun > 0) { blankSeparatedBoundaries++; }
        blankRun = 0;
      }

      return { totalBoundaries, blankSeparatedBoundaries };
    })();

  const shouldUseBlankLineAsParagraphSeparator = (() => {
    if (!hasBlankLine) { return false; }
    if (mode === 'anyBlankLine') { return true; }
    if (boundaryStats.totalBoundaries === 0) { return false; }
    if (mode === 'requireAll') {
      return boundaryStats.blankSeparatedBoundaries === boundaryStats.totalBoundaries;
    }
    // majority
    return (boundaryStats.blankSeparatedBoundaries / boundaryStats.totalBoundaries) >= 0.6;
  })();

  const paragraphBlankLines = Math.max(0, Number(config.lineSpacing || 0));
  const betweenParagraphSeparator = '\n'.repeat(paragraphBlankLines + 1);

  type Paragraph = { lines: string[]; skipFormat: boolean };
  const paragraphs: Paragraph[] = [];

  if (!shouldUseBlankLineAsParagraphSeparator) {
    // 无空行：一行一段
    for (const l of lines) {
      if (!l.trim()) { continue; }
      paragraphs.push({ lines: [l], skipFormat: shouldSkipFormatLine(l) });
    }
  } else {
    // 有空行：默认“空行=段落分隔”。
    // 这里统一按“空行即分段”处理。
    let current: string[] = [];
    let currentSkip = false;
    const flush = () => {
      const cleaned = current.filter(s => s.trim().length > 0);
      if (cleaned.length > 0) {
        paragraphs.push({ lines: cleaned, skipFormat: currentSkip });
      }
      current = [];
      currentSkip = false;
    };

    const countLeadingIndentUnits = (s: string, unitChar: string): number => {
      let n = 0;
      while (n < s.length && s[n] === unitChar) { n++; }
      return n;
    };

    const indentChar = config.useFullWidthIndent ? '\u3000' : ' ';
    const expectedContinuationUnits = Math.max(0, Number(config.overallIndent || 0));
    const expectedFirstLineUnits = expectedContinuationUnits + Math.max(0, Number(config.paragraphIndent || 0));

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.trim().length !== 0) {
        // 某些前缀行（如 Markdown 标题）不参与格式化：作为独立段落原样保留。
        if (shouldSkipFormatLine(line)) {
          if (current.length > 0) { flush(); }
          paragraphs.push({ lines: [line], skipFormat: true });
          i++;
          continue;
        }

        // 如果某一行本身已经带“首行缩进”（看起来是新段落开头），
        // 即使段间没有空行，也不要把它并入上一段。
        // 该行为默认开启，可用 paragraphSplitOnIndentedLine 关闭。
        if (splitOnIndentedLine && current.length > 0) {
          const leading = countLeadingIndentUnits(line, indentChar);
          if (leading >= expectedFirstLineUnits && expectedFirstLineUnits > expectedContinuationUnits) {
            flush();
          }
        }

        current.push(line);
        i++;
        continue;
      }

      // 跳过连续空行
      while (i < lines.length && lines[i].trim().length === 0) {
        i++;
      }

      // 尾部空行直接丢弃
      if (i >= lines.length) {
        break;
      }

      // 默认：空行即段落分隔
      flush();
    }
    flush();
  }

  if (paragraphs.length === 0) { return ''; }

  const indentChar = config.useFullWidthIndent ? '\u3000' : ' ';
  const overallIndentString = indentChar.repeat(Math.max(0, config.overallIndent || 0));
  const paragraphIndentString = indentChar.repeat(Math.max(0, config.paragraphIndent || 0));
  const firstLineIndent = overallIndentString + paragraphIndentString;

  const formattedParagraphs = paragraphs.map(p => {
    if (p.skipFormat) {
      // 原样保留（仅保留原行序列，不做 trim/合并/缩进）。
      return p.lines.join('\n');
    }

    const merged = normalizeMergedParagraph(p.lines);
    if (!merged) { return ''; }
    return firstLineIndent + merged;
  }).filter(Boolean);

  return formattedParagraphs.join(betweenParagraphSeparator);
};

export type { FormatConfig };
