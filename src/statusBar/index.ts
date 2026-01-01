import * as vscode from 'vscode';
import { StatusBarManager } from './statusBarManager';

/**
 * 注册状态栏
 * @param context 扩展上下文
 */
export const registerStatusBar = (context: vscode.ExtensionContext): void => {
  const statusBarManager = new StatusBarManager(context);
  context.subscriptions.push(statusBarManager);
};