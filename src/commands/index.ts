import * as vscode from 'vscode';
import { initWorkspace } from './initWorkspace';
import { createItem, CreateItemType } from './createItems';

/**
 * 将命令执行包装，自动捕获同步或异步错误并显示友好提示
 */
function safeExec(fn: (...args: any[]) => any) {
  return (...args: any[]) => {
    try {
      const res = fn(...args);
      // 处理异步函数的抛错
      if (res && typeof res.then === 'function') {
        return res.catch((err: any) => {
          console.error('[Novel Helper] 命令执行失败（异步）:', err);
          vscode.window.showErrorMessage(`命令执行失败：${(err && err.message) ? err.message : String(err)}`);
        });
      }
      return res;
    } catch (err) {
      console.error('[Novel Helper] 命令执行失败（同步）:', err);
      vscode.window.showErrorMessage(`命令执行失败：${(err && (err as Error).message) ? (err as Error).message : String(err)}`);
    }
  };
}

/**
 * 注册所有命令
 * @param context 扩展上下文
 */
export const registerCommands = (context: vscode.ExtensionContext): void => {
  // 初始化工作区
  const initWorkspaceCmd = vscode.commands.registerCommand('novel-helper.initWorkspace', safeExec(initWorkspace));
  context.subscriptions.push(initWorkspaceCmd);

  // 创建小说项
  const createItemCmd = vscode.commands.registerCommand('novel-helper.createItem', safeExec((type: CreateItemType, parentPath?: string) => {
    createItem(type, parentPath);
  }));
  context.subscriptions.push(createItemCmd);

  // 格式化文档
  const formatDocumentCmd = vscode.commands.registerCommand('novel-helper.formatDocument', safeExec(async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('未打开编辑器');
      return;
    }
    await vscode.commands.executeCommand('editor.action.formatDocument');
  }));
  context.subscriptions.push(formatDocumentCmd);

  // 打开配置面板（命令入口）
  const openConfigPanelCmd = vscode.commands.registerCommand('novel-helper.openConfigPanel', safeExec(() => {
    vscode.commands.executeCommand('novel-helper.showConfigPanel');
  }));
  context.subscriptions.push(openConfigPanelCmd);
};