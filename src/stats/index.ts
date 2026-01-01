import * as vscode from 'vscode';
import { StatsManager } from './statsManager';

/**
 * 注册统计功能
 * @param context 扩展上下文
 */
export const registerStats = (context: vscode.ExtensionContext): void => {
  const statsManager = new StatsManager(context);
  context.subscriptions.push(statsManager);
};