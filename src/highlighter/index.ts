import * as vscode from 'vscode';
import { Highlighter } from './highlighter';

/**
 * 注册高亮功能
 * @param context 扩展上下文
 */
export const registerHighlighter = (context: vscode.ExtensionContext): vscode.Disposable => {
  const highlighter = new Highlighter(context);
  context.subscriptions.push(highlighter);
  return highlighter;
};