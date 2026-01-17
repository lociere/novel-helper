import * as vscode from 'vscode';
import { openConfigPanel } from './configPanel';

/**
 * 注册配置面板
 */
export const registerPanel = (): vscode.Disposable => {
  // 注册打开配置面板命令
  const open = vscode.commands.registerCommand('novel-helper.openConfigPanel', openConfigPanel);
  // 兼容旧命令（package.json 中仍贡献了 showConfigPanel）
  const show = vscode.commands.registerCommand('novel-helper.showConfigPanel', openConfigPanel);
  return vscode.Disposable.from(open, show);
};