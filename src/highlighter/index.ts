import * as vscode from 'vscode';
import { HighlightManager } from './manager';

export { HighlightManager };

/**
 * 注册高亮管理器
 */
export const registerHighlighter = (): HighlightManager => {
  return new HighlightManager();
};
