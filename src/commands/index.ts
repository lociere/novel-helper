import * as vscode from 'vscode';
import { initWorkspace } from './initWorkspace';
import { closeWorkspace } from './closeWorkspace';
import { createItem, CreateItemType } from './createItems';
import { getVSCodeConfig, isWorkspaceInitialized } from '../utils/config';
import { formatText } from '../formatter/formatter';

const SUPPORTED_FORMAT_LANGS = new Set(['plaintext', 'markdown']);

const ensureInitialized = (): boolean => {
  if (isWorkspaceInitialized()) {
    return true;
  }
  vscode.window.showWarningMessage('Novel Helper：当前工作区未初始化，请先运行 "Novel Helper: 开启小说工作区"。');
  return false;
};

const canFormatByNovelHelper = (doc: vscode.TextDocument): boolean => {
  if (doc.uri.scheme !== 'file') { return false; }
  return SUPPORTED_FORMAT_LANGS.has(doc.languageId);
};

const shouldSkipFormatLine = (line: string): boolean => {
  const trimmedLeft = line.trimStart();
  if (!trimmedLeft) { return false; }
  // 与 formatter 逻辑保持一致：某些前缀行（例如 Markdown 标题）不进行格式化。
  return trimmedLeft.startsWith('#');
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
      const next = formatText(original, {
        paragraphIndent: cfg.paragraphIndent,
        overallIndent: cfg.overallIndent,
        lineSpacing: cfg.lineSpacing,
        intraLineSpacing: cfg.intraLineSpacing,
        paragraphSplitMode: cfg.paragraphSplitMode,
        paragraphSplitOnIndentedLine: cfg.paragraphSplitOnIndentedLine,
        useFullWidthIndent: cfg.useFullWidthIndent
      });

      // 自检：如果配置要求段首缩进，但输出首个非空行没有缩进，则提示用户定位原因
      const indentChar = cfg.useFullWidthIndent ? '\u3000' : ' ';
      const expectedFirstLineIndent = indentChar.repeat(Math.max(0, (cfg.overallIndent || 0) + (cfg.paragraphIndent || 0)));
      const firstNonEmptyFormatted = next
        .split(/\r?\n/)
        .find(l => l.trim().length > 0 && !shouldSkipFormatLine(l)) ?? '';
      if (expectedFirstLineIndent.length > 0 && firstNonEmptyFormatted && !firstNonEmptyFormatted.startsWith(expectedFirstLineIndent)) {
        const preview = firstNonEmptyFormatted.slice(0, Math.min(16, firstNonEmptyFormatted.length));
        vscode.window.showWarningMessage(
          `Novel Helper 格式化后检测到“段首缩进未写入”。当前缩进配置：段首=${cfg.paragraphIndent}, 整体=${cfg.overallIndent}, 全角缩进=${cfg.useFullWidthIndent ? '是' : '否'}；首行前缀预览：${JSON.stringify(preview)}`
        );
      }

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(original.length)
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, next);
      });

      // 二次校验：格式化结果是否被其他操作（例如 formatOnSave/其他扩展）覆盖
      try {
        const afterText = editor.document.getText();
        const afterFirstNonEmptyFormatted = afterText
          .split(/\r?\n/)
          .find(l => l.trim().length > 0 && !shouldSkipFormatLine(l)) ?? '';
        const persisted = expectedFirstLineIndent.length === 0
          ? true
          : (afterFirstNonEmptyFormatted ? afterFirstNonEmptyFormatted.startsWith(expectedFirstLineIndent) : true);

        if (!persisted) {
          vscode.window.showWarningMessage(
            'Novel Helper：已生成段首缩进，但写入后又被覆盖/清理了。请检查是否开启了 formatOnSave，或是否有其他 formatter/保存动作在改写文本。'
          );
        }
      } catch {
        // ignore
      }
    }],
    ['novel-helper.openConfigPanel', () => {
      if (!ensureInitialized()) { return; }
      return vscode.commands.executeCommand('novel-helper.showConfigPanel');
    }]
  ];

  registrations.forEach(([command, handler]) => {
    context.subscriptions.push(vscode.commands.registerCommand(command, safeExec(handler)));
  });
};