import * as vscode from 'vscode';
import { initWorkspace } from './initWorkspace';
import { createItem, CreateItemType } from './createItems';

/**
 * 将命令执行包装，自动捕获同步或异步错误并显示友好提示
 */
function isThenable(value: unknown): value is Thenable<unknown> {
  return !!value && typeof value === 'object' && 'then' in (value as any) && typeof (value as any).then === 'function';
}

function safeExec<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult | Thenable<TResult>) {
  return (...args: TArgs) => {
    try {
      const res = fn(...args);
      // 处理异步函数的抛错
      if (isThenable(res)) {
        return Promise.resolve(res).catch((err: unknown) => {
          console.error('[Novel Helper] 命令执行失败（异步）:', err);
          const msg = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`命令执行失败：${msg}`);
        });
      }
      return res;
    } catch (err) {
      console.error('[Novel Helper] 命令执行失败（同步）:', err);
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`命令执行失败：${msg}`);
    }
  };
}

/**
 * 注册所有命令
 * @param context 扩展上下文
 */
export const registerCommands = (context: vscode.ExtensionContext): void => {
  const registrations: Array<[string, (...args: any[]) => any]> = [
    ['novel-helper.initWorkspace', initWorkspace],
    ['novel-helper.createItem', (type: CreateItemType, parentPath?: string) => createItem(type, parentPath)],
    ['novel-helper.formatDocument', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('未打开编辑器');
        return;
      }
      await vscode.commands.executeCommand('editor.action.formatDocument');
    }],
    ['novel-helper.openConfigPanel', () => vscode.commands.executeCommand('novel-helper.showConfigPanel')]
  ];

  registrations.forEach(([command, handler]) => {
    context.subscriptions.push(vscode.commands.registerCommand(command, safeExec(handler)));
  });
};