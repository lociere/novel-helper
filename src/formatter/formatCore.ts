import { splitByVSCodeColumns, stringVSCodeColumns } from './textWidth';

type FormatConfig = {
  paragraphIndent: number;
  overallIndent: number;
  /**
   * 段间距（段间空行数）。
   */
  lineSpacing: number;
  /**
   * 段内行间距（段内空行数）。
   */
  intraLineSpacing: number;
  hardWrapOnFormat: boolean;
  /**
   * 是否使用全角空格（U+3000）作为缩进单位。
   * 默认 false（半角空格）。
   */
  useFullWidthIndent?: boolean;
  /**
   * 一行字符数（用于判断“会软换行”的阈值，并据此拆分为硬换行）。
   * 由调用方根据插件配置传入。
   */
  lineCharLimit: number;

  /**
   * VS Code 的制表宽度（editor.tabSize）。用于可见列计算，默认 4。
   */
  tabSize?: number;

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

  /**
   * 将同一段内“只是为了换行而手动断行”的多行文字合并为一行，再按阈值重新硬换行。
   * 默认开启。仅在 hardWrapOnFormat 开启时生效。
   */
  mergeSoftWrappedLines?: boolean;
};

export const formatText = (text: string, config: FormatConfig): string => {
  // 1) 先确认段落，再处理段内行间距
  // - 段落：以“空行”作为分隔信号（有空行时），否则默认“一行一段”
  // - 段间距：段与段之间插入 lineSpacing 个空行
  // - 行间距：同一段内相邻两行之间插入 intraLineSpacing 个空行
  // - 幂等性：当文档已按本规则格式化时，二次格式化不会继续增加空行
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const hasBlankLine = lines.some(l => l.trim().length === 0);

  const mode = config.paragraphSplitMode ?? 'anyBlankLine';
  const splitOnIndentedLine = config.paragraphSplitOnIndentedLine !== false;

  // 统计“段落边界是否有空行”的比例，用于 requireAll/majority 模式判定
  // 边界：两个非空行之间的分隔处。
  const boundaryStats = (() => {
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
  const intraBlankLines = Math.max(0, Number(config.intraLineSpacing || 0));

  const betweenParagraphSeparator = '\n'.repeat(paragraphBlankLines + 1);
  const withinParagraphSeparator = '\n'.repeat(intraBlankLines + 1);

  type Paragraph = string[]; // 一个段落由多行（段内行）组成
  const paragraphs: Paragraph[] = [];

  if (!shouldUseBlankLineAsParagraphSeparator) {
    // 无空行：一行一段
    for (const l of lines) {
      const t = l.trim();
      if (!t) { continue; }
      paragraphs.push([t]);
    }
  } else {
    // 有空行：默认“空行=段落分隔”。
    // 但为了幂等：当文本已经被本 formatter 格式化过，段内相邻行之间会出现 intraLineSpacing 个空行。
    // 因此解析时：
    // - run >= 1：通常都视作段落分隔
    // - 仅当 run == intraLineSpacing（且 intraLineSpacing>0）并且“下一行看起来是段内续行”时，才视为段内换行
    let current: string[] = [];
    const flush = () => {
      const trimmed = current.map(s => s.trim()).filter(Boolean);
      if (trimmed.length > 0) {
        paragraphs.push(trimmed);
      }
      current = [];
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

      // 统计连续空行数
      let run = 0;
      while (i < lines.length && lines[i].trim().length === 0) {
        run++;
        i++;
      }

      // 尾部空行直接丢弃
      if (i >= lines.length) {
        break;
      }

      // lineSpacing == 0 时：任何空行都视作段落分隔
      if (paragraphBlankLines === 0) {
        flush();
        continue;
      }

      // 仅识别“已格式化输出的段内行间距”作为段内换行（否则会把用户原稿的空行分段错误合并）
      if (
        intraBlankLines > 0
        && run === intraBlankLines
        && expectedFirstLineUnits > expectedContinuationUnits
      ) {
        const nextLine = lines[i];
        const nextLeading = countLeadingIndentUnits(nextLine, indentChar);
        if (nextLeading === expectedContinuationUnits) {
          continue;
        }
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
  const continuationIndent = overallIndentString;

  const limit = Number(config.lineCharLimit || 0);
  const enableSplit = Boolean(config.hardWrapOnFormat) && limit > 0;

  // 将同一段内的多行合并为一行（更接近“软换行看起来是一段”的写作习惯）
  const shouldMergeSoftWrapLines = enableSplit && config.mergeSoftWrappedLines !== false;
  const normalizedParagraphs = shouldMergeSoftWrapLines
    ? paragraphs.map(p => {
      const merged = p.map(s => s.trim()).filter(Boolean).join('');
      return merged ? [merged] : [];
    }).filter(p => p.length > 0)
    : paragraphs;

  const tabSize = Math.max(1, Number(config.tabSize || 4));

  const splitLineByLimit = (s: string, maxLen: number): string[] => {
    return splitByVSCodeColumns(s, maxLen, tabSize);
  };

  const formattedParagraphs = normalizedParagraphs.map(paragraphLines => {
    const outLines: string[] = [];

    paragraphLines.forEach((raw, lineIndex) => {
      const content = raw.trim();
      if (!content) { return; }

      const baseIndent = (lineIndex === 0) ? firstLineIndent : continuationIndent;

      if (!enableSplit) {
        outLines.push(baseIndent + content);
        return;
      }

      // 先计算首行与续行的可用列宽（扣除缩进列数）
      const firstIndent = (lineIndex === 0) ? firstLineIndent : continuationIndent;
      const firstLimit = Math.max(1, limit - stringVSCodeColumns(firstIndent, tabSize));
      const contLimit = Math.max(1, limit - stringVSCodeColumns(continuationIndent, tabSize));

      // 若内容列数不超过首行可用列宽，直接输出（包含缩进）
      if (stringVSCodeColumns(content, tabSize) <= firstLimit) {
        outLines.push(baseIndent + content);
        return;
      }

      const firstParts = splitLineByLimit(content, firstLimit);
      if (firstParts.length > 0) {
        outLines.push(firstIndent + firstParts[0]);
      }

      const remainder = firstParts.slice(1).join('');
      if (remainder) {
        const contParts = splitLineByLimit(remainder, contLimit);
        for (const seg of contParts) {
          outLines.push(continuationIndent + seg);
        }
      }
    });

    return outLines.join(withinParagraphSeparator);
  });

  return formattedParagraphs.join(betweenParagraphSeparator);
};

export type { FormatConfig };
