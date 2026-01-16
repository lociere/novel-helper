import * as vscode from 'vscode';
import type { NovelHelperConfig } from '../utils/config';
import { formatText } from './formatCore';
import { buildFormatConfig } from './formatConfigBuilder';

/**
 * 文档格式化服务：将 VS Code 文档文本按 Novel Helper 规则格式化为新文本。
 *
 * 说明：
 * - 本模块不负责编辑器写入/生成 TextEdit，仅负责纯函数式的“输入→输出”。
 */
export const formatDocumentText = (document: vscode.TextDocument, cfg: NovelHelperConfig): string => {
  return formatText(document.getText(), buildFormatConfig(cfg));
};
