/** 文本相关工具函数 */

/** 统计文本字数：中文字符/中文标点按 1，英文单词/数字按 1。 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  let totalCount = 0;

  // 匹配中文字符及常见中文/全角标点（扩展范围）
  const chineseAndPunctuation = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f]/g);
  if (chineseAndPunctuation) {
    totalCount += chineseAndPunctuation.length;
  }

  // 将中文及中文标点替换为空，再统计剩下的单词/数字，避免重复计算
  const remainingText = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f]/g, ' ');

  // 匹配英文单词和数字（连续的字母/数字/下划线/短横线算 1 个词）
  const wordMatches = remainingText.match(/[a-zA-Z0-9_\-]+/g);
  if (wordMatches) {
    totalCount += wordMatches.length;
  }

  return totalCount;
};
