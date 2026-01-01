import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerTreeView } from './treeView';
import { registerStatusBar } from './statusBar';
import { registerPanel } from './panel';
import { registerHighlighter } from './highlighter';
import { registerStats } from './stats';
import { registerFormatter } from './formatter';

/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('novel-helper 已激活！');

  // 注册所有模块
  registerCommands(context);
  registerTreeView(context);
  registerStatusBar(context);
  registerPanel(context);
  registerHighlighter(context);
  registerStats(context);
  registerFormatter(context);
}

/**
 * 扩展停用时执行
 */
export function deactivate(): void {
  console.log('novel-helper 已停用！');
}