import * as vscode from 'vscode';
import { getVSCodeConfig, getEditorWrapSettings } from '../utils/config';
import { splitByVSCodeColumns, stringVSCodeColumns } from './textWidth';

const SUPPORTED_LANGS = new Set(['plaintext', 'markdown']);

const isSupportedDoc = (doc: vscode.TextDocument): boolean => {
  if (doc.uri.scheme !== 'file') { return false; }
  return SUPPORTED_LANGS.has(doc.languageId);
};

/**
 * 将段落按指定列宽进行硬换行（插入真实换行符）。
 * - column <= 0 时不处理
 * - 首行使用 firstLineIndent；后续折行使用 continuationIndent
 * - column 小于等于首行缩进长度时不处理（避免死循环）
 */
export const hardWrapParagraph = (
  paragraph: string,
  column: number,
  firstLineIndent: string,
  continuationIndent = '',
  lineSeparator = '\n',
  tabSize = 4
): string => {
  const maxColumn = Number(column || 0);
  if (!maxColumn || maxColumn <= 0) { return firstLineIndent + paragraph; }

  // maxColumn 是 VS Code/Monaco 的“可见列数”阈值，这里需要扣除缩进自身的列数
  const firstIndentWidth = stringVSCodeColumns(firstLineIndent, tabSize);
  const contIndentWidth = stringVSCodeColumns(continuationIndent, tabSize);
  if (firstIndentWidth >= maxColumn) { return firstLineIndent + paragraph; }

  const firstLimit = Math.max(1, maxColumn - firstIndentWidth);
  const contLimit = Math.max(1, maxColumn - contIndentWidth);

  const parts = splitByVSCodeColumns(paragraph, firstLimit, tabSize);
  if (parts.length <= 1) {
    return firstLineIndent + paragraph;
  }

  const out: string[] = [];
  out.push(firstLineIndent + parts[0]);

  // 续行继续按 contLimit 折行（避免第一段拆分后仍超阈值）
  for (let i = 1; i < parts.length; i++) {
    const more = splitByVSCodeColumns(parts[i], contLimit, tabSize);
    for (const seg of more) {
      out.push(continuationIndent + seg);
    }
  }

  return out.join(lineSeparator);
};

/**
 * 自动硬换行：当光标所在行超过阈值后，自动插入换行符（\n）
 * 说明：默认关闭（阈值为 0），避免改变既有行为。
 */
export class HardWrapManager implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private isApplying = false;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => this.onChange(e)),
      vscode.window.onDidChangeActiveTextEditor(() => {
        // 切换编辑器时重置保护，避免边界状态影响
        this.isApplying = false;
      })
    );

    this.context.subscriptions.push(...this.disposables);
  }

  private onChange(event: vscode.TextDocumentChangeEvent): void {
    if (this.isApplying) { return; }

    const cfg = getVSCodeConfig();
    const wrap = getEditorWrapSettings(event.document);
    const column = (() => {
      if (cfg.autoSyncWordWrapColumn) {
        return cfg.editorWordWrapColumn && cfg.editorWordWrapColumn > 0
          ? cfg.editorWordWrapColumn
          : wrap.wordWrapColumn;
      }
      return Number(cfg.autoHardWrapColumn || 0);
    })();
    if (!column || column <= 0) { return; }

    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }
    if (editor.document !== event.document) { return; }
    if (!isSupportedDoc(editor.document)) { return; }

    // 仅处理单光标输入，避免多选区场景产生意外行为
    if (editor.selections.length !== 1) { return; }

    // 只在“输入文本且不包含换行符”时触发
    const hasNonNewlineInsert = event.contentChanges.some(c => c.text && !c.text.includes('\n') && !c.text.includes('\r'));
    if (!hasNonNewlineInsert) { return; }

    const pos = editor.selection.active;
    const line = editor.document.lineAt(pos.line);

    // 仅在行尾时硬换行，避免在行中间插入导致“断句”
    if (pos.character < line.text.length) { return; }

    // 阈值按“整行可见列数”理解（包含缩进），以匹配 VS Code/Monaco 的 wordWrapColumn
    const lineWidth = stringVSCodeColumns(line.text, wrap.tabSize);

    // 当前行达到阈值后触发
    if (lineWidth < column) { return; }

    const indentChar = cfg.useFullWidthIndent ? '\u3000' : ' ';
    const overallIndentToInsert = indentChar.repeat(Math.max(0, cfg.overallIndent || 0));

    this.isApplying = true;
    editor.edit(editBuilder => {
      // 段首缩进仅作用于段落首行；自动换行是段内折行，因此不插入缩进
      // 但“整体缩进”对所有行生效，因此在换行后补整体缩进。
      editBuilder.insert(pos, '\n' + overallIndentToInsert);
    }).then(
      () => { this.isApplying = false; },
      () => { this.isApplying = false; }
    );
  }

  dispose(): void {
    this.disposables.forEach(d => {
      try { d.dispose(); } catch { /* ignore */ }
    });
  }
}
