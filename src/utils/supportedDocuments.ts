import * as vscode from 'vscode';

/**
 * Novel Helper 支持处理的文本文档类型。
 *
 * 说明：该集合用于格式化、自动排版等功能的启用判断。
 */
export const SUPPORTED_TEXT_LANGUAGE_IDS = new Set(['plaintext', 'markdown']);

/**
 * 文档是否为本插件可处理的“文本类文件”。
 */
export const isSupportedTextDocument = (doc: vscode.TextDocument): boolean => {
  if (doc.uri.scheme !== 'file') { return false; }
  return SUPPORTED_TEXT_LANGUAGE_IDS.has(doc.languageId);
};

/**
 * VS Code DocumentSelector：用于注册格式化器等语言相关能力。
 */
export const TEXT_DOCUMENT_SELECTORS: vscode.DocumentSelector = [
  { scheme: 'file', language: 'plaintext' },
  { scheme: 'file', language: 'markdown' }
];
