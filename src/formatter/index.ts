import * as vscode from 'vscode';
import { Formatter } from './formatter';
import { HardWrapManager } from './hardWrapManager';

/**
 * 注册格式化功能
 * @param context 扩展上下文
 */
export const registerFormatter = (context: vscode.ExtensionContext): vscode.Disposable => {
  const formatter = new Formatter(context);
  context.subscriptions.push(formatter);

  const hardWrap = new HardWrapManager(context);
  context.subscriptions.push(hardWrap);

  return vscode.Disposable.from(formatter, hardWrap);
};