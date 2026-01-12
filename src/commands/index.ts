import * as vscode from 'vscode';
import { initWorkspace } from './initWorkspace';
import { createItem, CreateItemType } from './createItems';
import { getVSCodeConfig } from '../utils/config';
import { formatText } from '../formatter/formatter';

const SUPPORTED_FORMAT_LANGS = new Set(['plaintext', 'markdown']);

const canFormatByNovelHelper = (doc: vscode.TextDocument): boolean => {
  if (doc.uri.scheme !== 'file') { return false; }
  return SUPPORTED_FORMAT_LANGS.has(doc.languageId);
};

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

      const document = editor.document;
      if (!canFormatByNovelHelper(document)) {
        vscode.window.showWarningMessage('当前文件类型不支持 Novel Helper 格式化（仅支持 txt/plaintext 与 markdown）');
        return;
      }

      const cfg = getVSCodeConfig();
      const original = document.getText();
      const next = formatText(original, {
        paragraphIndent: cfg.paragraphIndent,
        overallIndent: cfg.overallIndent,
        lineSpacing: cfg.lineSpacing,
        hardWrapOnFormat: cfg.hardWrapOnFormat,
        autoHardWrapColumn: cfg.autoHardWrapColumn
      });

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(original.length)
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, next);
      });
    }],
    ['novel-helper.openConfigPanel', () => vscode.commands.executeCommand('novel-helper.showConfigPanel')]
  ];

  registrations.forEach(([command, handler]) => {
    context.subscriptions.push(vscode.commands.registerCommand(command, safeExec(handler)));
  });
};