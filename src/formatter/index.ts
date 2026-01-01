import * as vscode from 'vscode';
import { Formatter } from './formatter';

/**
 * 注册格式化功能
 * @param context 扩展上下文
 */
export const registerFormatter = (context: vscode.ExtensionContext): void => {
  const formatter = new Formatter(context);
  context.subscriptions.push(formatter);
};