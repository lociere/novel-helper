import * as vscode from 'vscode';
import { isWorkspaceInitialized } from '../utils/config';
import type { NovelTreeItem } from '../treeView/treeItem';

const isDeletableTreeItem = (arg: unknown): arg is NovelTreeItem => {
  if (!arg || typeof arg !== 'object') { return false; }
  const item = arg as NovelTreeItem;
  return (item.type === 'file' || item.type === 'directory') && !!item.resourceUri;
};

export const deleteItem = async (arg: unknown): Promise<void> => {
  if (!isWorkspaceInitialized()) {
    vscode.window.showWarningMessage('Novel Helper：当前工作区未初始化，无法删除。');
    return;
  }

  if (!isDeletableTreeItem(arg)) {
    vscode.window.showWarningMessage('请选择要删除的文件/文件夹节点。');
    return;
  }

  const uri = arg.resourceUri!;
  const isDir = arg.type === 'directory';
  const label = typeof arg.label === 'string' ? arg.label : (arg.label?.toString() || uri.fsPath);

  try {
    await vscode.workspace.fs.delete(uri, { recursive: isDir, useTrash: true });
  } catch (err) {
    console.error('[Novel Helper] 删除失败：', err);
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`删除失败：${msg}`);
    return;
  }

  // 非弹窗反馈：状态栏短提示
  try {
    vscode.window.setStatusBarMessage(`已删除${isDir ? '文件夹' : '文件'}：${label}（可在回收站恢复）`, 2500);
  } catch {
    // ignore
  }

  // 立即刷新树视图
  try {
    await vscode.commands.executeCommand('novelTreeView.refresh');
  } catch {
    // ignore
  }
};
