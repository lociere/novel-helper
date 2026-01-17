import * as vscode from 'vscode';
import { initWorkspace } from './initWorkspace';
import { closeWorkspace } from './closeWorkspace';
import { createItem, CreateItemType } from './createItems';
import { deleteItem } from './deleteItem';
import { getVSCodeConfig, isWorkspaceInitialized } from '../config';
import { isSupportedTextDocument } from '../utils/supportedDocuments';
import { formatText, buildFormatConfig } from '../formatter';

const ensureInitialized = (): boolean => {
  if (isWorkspaceInitialized()) {
    return true;
  }
  vscode.window.showWarningMessage('Novel Helper：当前工作区未初始化，请先运行 "Novel Helper: 开启小说工作区"。');
  return false;
};

const canFormatByNovelHelper = (doc: vscode.TextDocument): boolean => isSupportedTextDocument(doc);


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
export const registerCommands = (
  context: vscode.ExtensionContext,
  opts?: { onInitialized?: () => void; onClosed?: () => void }
): void => {
  const registrations: Array<[string, (...args: any[]) => any]> = [
    ['novel-helper.initWorkspace', async () => {
      await initWorkspace();
      opts?.onInitialized?.();
    }],
    ['novel-helper.closeWorkspace', async () => {
      await closeWorkspace();
      opts?.onClosed?.();
    }],
    ['novel-helper.createItem', (type: CreateItemType, parentPath?: string) => {
      if (!ensureInitialized()) { return; }
      return createItem(type, parentPath);
    }],
    ['novel-helper.deleteItem', async (arg?: unknown) => {
      if (!ensureInitialized()) { return; }
      return deleteItem(arg);
    }],
    ['novel-helper.formatDocument', async () => {
      if (!ensureInitialized()) { return; }
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('未打开编辑器');
        return;
      }

      const document = editor.document;
      if (!canFormatByNovelHelper(document)) {
        vscode.window.showWarningMessage(`当前文件类型不支持 Novel Helper 格式化：languageId=${document.languageId}（仅支持 plaintext 与 markdown）`);
        return;
      }

      const cfg = getVSCodeConfig();

      const original = document.getText();
      const formatConfig = buildFormatConfig(cfg);
      const next = formatText(original, formatConfig);

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(original.length)
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, next);
      });
      
      vscode.window.setStatusBarMessage('Novel Helper: 格式化完成', 2000);
    }]
  ];

  registrations.forEach(([cmd, fn]) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd, safeExec(fn))
    );
  });
};
