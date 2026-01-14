import * as vscode from 'vscode';
import { openConfigPanel } from './configPanel';

/**
 * 注册配置面板
 * @param context 扩展上下文
 */
export const registerPanel = (context: vscode.ExtensionContext): vscode.Disposable => {
  // 注册打开配置面板命令
  const openConfigPanelCmd = vscode.commands.registerCommand('novel-helper.showConfigPanel', openConfigPanel);
  context.subscriptions.push(openConfigPanelCmd);
  return openConfigPanelCmd;
};