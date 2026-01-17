import * as vscode from 'vscode';
import { NovelTreeDataProvider } from './novelTreeDataProvider';
import { getWorkspaceRoot } from '../utils/helpers';
import { isWorkspaceInitialized } from '../utils/config';
import { isSupportedTextDocument } from '../utils/supportedDocuments';

// 超大文件字数统计保护阈值（字符数），超过则仅在保存时刷新
const LARGE_FILE_CHAR_THRESHOLD = 500_000;

const getDebounceDelayMs = (textLength: number): number => {
  // 小文件保持几乎实时；较大文件适度降频
  if (textLength > 200_000) { return 1500; }
  return 500;
};

/**
 * 注册小说树视图
 * @param context 扩展上下文
 */
export const registerTreeView = (context: vscode.ExtensionContext): vscode.Disposable => {
  const treeDataProvider = new NovelTreeDataProvider();
  const treeView = vscode.window.createTreeView('novelTreeView', {
    treeDataProvider,
    showCollapseAll: true
  });

  // 注册刷新命令
  const refreshCmd = vscode.commands.registerCommand('novelTreeView.refresh', () => {
    treeDataProvider.refresh();
  });
  context.subscriptions.push(refreshCmd);

  context.subscriptions.push(treeView);

  // 监听文件保存（立即刷新）
  const onSave = vscode.workspace.onDidSaveTextDocument(() => {
    treeDataProvider.refresh();
  });
  context.subscriptions.push(onSave);

  // 监听文件系统变化（创建/删除/重命名）：修复删除后树视图不刷新的问题
  // 仅在已开启小说工作区时启用，且尽量做防抖。
  let fsDebounceTimer: NodeJS.Timeout | undefined;
  const scheduleRefresh = (delay: number) => {
    if (!treeView.visible) { return; }
    if (fsDebounceTimer) { clearTimeout(fsDebounceTimer); }
    fsDebounceTimer = setTimeout(() => treeDataProvider.refresh(), delay);
  };

  const root = isWorkspaceInitialized() ? getWorkspaceRoot() : undefined;
  if (root) {
    const fsWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, '**/*'));
    const onCreate = fsWatcher.onDidCreate(() => scheduleRefresh(200));
    const onDelete = fsWatcher.onDidDelete(() => scheduleRefresh(200));
    const onChangeFs = fsWatcher.onDidChange(() => scheduleRefresh(500));
    context.subscriptions.push(fsWatcher, onCreate, onDelete, onChangeFs);
  }

  // 监听内容变化（防抖刷新，用于实时更新字数）
  let debounceTimer: NodeJS.Timeout | undefined;
  const onChange = vscode.workspace.onDidChangeTextDocument(e => {
    // 仅关注相关文本文件，且树视图可见时再刷新，降低不必要的开销
    if (!treeView.visible) { return; }
    if (isSupportedTextDocument(e.document)) {
      const textLength = e.document.getText().length;
      // 超大文件：仅在保存时刷新，避免频繁遍历影响性能
      if (textLength > LARGE_FILE_CHAR_THRESHOLD) { return; }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        treeDataProvider.refresh();
      }, getDebounceDelayMs(textLength));
    }
  });
  context.subscriptions.push(onChange);

  return vscode.Disposable.from(treeView, refreshCmd, onSave, onChange);
};