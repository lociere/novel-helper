import * as vscode from 'vscode';
import { Highlighter } from './highlighter';

/**
 * 注册高亮功能
 * @param context 扩展上下文
 */
export const registerHighlighter = (context: vscode.ExtensionContext): void => {
  const highlighter = new Highlighter(context);
  context.subscriptions.push(highlighter);
};