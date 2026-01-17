import * as vscode from 'vscode';
import { HighlightManager } from './manager';

export { HighlightManager };

/**
 * 注册高亮管理器
 */
export const registerHighlighter = (context: vscode.ExtensionContext): HighlightManager => {
  return new HighlightManager(context);
};
