import * as vscode from 'vscode';
import type { NovelHelperConfig } from './types';

/** 读取 VS Code 的编辑器换行/制表设置，用于与自动换行逻辑对齐。 */
export const getEditorWrapSettings = (doc?: vscode.TextDocument): {
  wordWrap: string;
  wordWrapColumn: number;
  tabSize: number;
} => {
  const editorConfig = vscode.workspace.getConfiguration('editor', doc?.uri);
  const wordWrap = editorConfig.get<string>('wordWrap', 'off');
  const wordWrapColumn = editorConfig.get<number>('wordWrapColumn', 80);
  let tabSize = editorConfig.get<number | string>('tabSize', 4);

  // 若有活动编辑器且对应文档，优先使用当前解析后的数值 tabSize
  const ed = vscode.window.activeTextEditor;
  if (ed && (!doc || ed.document === doc)) {
    const ts = ed.options.tabSize;
    if (typeof ts === 'number' && Number.isFinite(ts) && ts > 0) {
      tabSize = ts;
    }
  }

  // 配置可能为 'auto'，此时兜底 4
  const numericTabSize = typeof tabSize === 'number' ? tabSize : 4;
  return {
    wordWrap,
    wordWrapColumn: Math.max(1, Number(wordWrapColumn || 80)),
    tabSize: Math.max(1, Number(numericTabSize || 4))
  };
};

export type EffectiveWrapSettings = {
  /** 0 表示不覆盖列宽（仍可启用 editor.wordWrap=wordWrapColumn） */
  column: number;
  tabSize: number;
  source: 'vscode' | 'novel-helper';
  editor: ReturnType<typeof getEditorWrapSettings>;
};

/**
 * 计算“建议写入 VS Code 的显示换行列宽”。
 * - 当 novel-helper.editorWordWrapColumn > 0：使用该值
 * - 否则：不覆盖列宽，返回 0（仅用于 UI 展示）
 */
export const getEffectiveWrapSettings = (
  cfg: NovelHelperConfig,
  doc?: vscode.TextDocument
): EffectiveWrapSettings => {
  const editor = getEditorWrapSettings(doc);

  if (cfg.editorWordWrapColumn && cfg.editorWordWrapColumn > 0) {
    return { column: cfg.editorWordWrapColumn, tabSize: editor.tabSize, source: 'novel-helper', editor };
  }
  return { column: 0, tabSize: editor.tabSize, source: 'vscode', editor };
};
