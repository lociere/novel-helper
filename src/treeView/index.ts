import * as vscode from 'vscode';
import { NovelTreeDataProvider } from './novelTreeDataProvider';

/**
 * 注册小说树视图
 * @param context 扩展上下文
 */
export const registerTreeView = (context: vscode.ExtensionContext): void => {
  const treeDataProvider = new NovelTreeDataProvider();
  const treeView = vscode.window.createTreeView('novelTreeView', {
    treeDataProvider,
    showCollapseAll: true
  });

  // 注册刷新命令
  context.subscriptions.push(vscode.commands.registerCommand('novelTreeView.refresh', () => {
    treeDataProvider.refresh();
  }));

  context.subscriptions.push(treeView);
};