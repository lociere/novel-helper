import * as vscode from 'vscode';
import { NovelTreeDataProvider } from './novelTreeDataProvider';

// 超大文件字数统计保护阈值（字符数），超过则仅在保存时刷新
const LARGE_FILE_CHAR_THRESHOLD = 500_000;

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
    // 仅关注相关文本文件，且树视图可见时再刷新，降低不必要的开销
    if (!treeView.visible) { return; }
    if (e.document.uri.scheme === 'file' && (e.document.fileName.endsWith('.txt') || e.document.fileName.endsWith('.md'))) {
      const textLength = e.document.getText().length;
      // 超大文件：仅在保存时刷新，避免频繁遍历影响性能
      if (textLength > LARGE_FILE_CHAR_THRESHOLD) { return; }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        treeDataProvider.refresh();
      }, 500); // 缩短至 500ms，提升“几乎实时”的体验
    }
  }));
};