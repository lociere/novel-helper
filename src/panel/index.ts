import * as vscode from 'vscode';
import { openConfigPanel } from './configPanel';

/**
 * 注册配置面板
 */
export const registerPanel = (): vscode.Disposable => {
  // 注册打开配置面板命令
  return vscode.commands.registerCommand('novel-helper.openConfigPanel', openConfigPanel);
};