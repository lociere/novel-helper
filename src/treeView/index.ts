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

  // 监听文件保存（立即刷新）
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
    treeDataProvider.refresh();
  }));

  // 监听内容变化（防抖刷新，用于实时更新字数）
  let debounceTimer: NodeJS.Timeout;
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
    // 仅关注相关文本文件
    if (e.document.uri.scheme === 'file' && (e.document.fileName.endsWith('.txt') || e.document.fileName.endsWith('.md'))) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        treeDataProvider.refresh();
      }, 2000); // 设置2秒延迟，尽量减少对输入的干扰
    }
  }));
};