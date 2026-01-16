import type { NovelHelperConfig } from '../utils/config';
import type { FormatConfig } from './formatCore';

/**
 * 将插件配置映射为格式化核心所需的配置结构。
 *
 * 职责边界：
 * - 本函数只负责“配置字段映射”，不涉及任何文本处理。
 * - 文本处理请在 formatCore / formatService 中完成。
 */
export const buildFormatConfig = (cfg: NovelHelperConfig): FormatConfig => {
  return {
    paragraphIndent: cfg.paragraphIndent,
    overallIndent: cfg.overallIndent,
    lineSpacing: cfg.lineSpacing,
    paragraphSplitMode: cfg.paragraphSplitMode,
    paragraphSplitOnIndentedLine: cfg.paragraphSplitOnIndentedLine,
    useFullWidthIndent: cfg.useFullWidthIndent
  };
};
