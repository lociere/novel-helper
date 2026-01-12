import * as vscode from 'vscode';
import { getVSCodeConfig } from '../utils/config';

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
  continuationIndent = ''
): string => {
  const maxColumn = Number(column || 0);
  if (!maxColumn || maxColumn <= 0) { return firstLineIndent + paragraph; }
  if (firstLineIndent.length >= maxColumn) { return firstLineIndent + paragraph; }

  const lines: string[] = [];
  let current = firstLineIndent;
  let isFirstLine = true;

  for (const ch of paragraph) {
    // 这里用 for..of 以支持 surrogate pair（如 emoji），减少字符切分问题
    const minLen = isFirstLine ? firstLineIndent.length : continuationIndent.length;
    if (current.length + ch.length > maxColumn && current.length > minLen) {
      lines.push(current);
      // 后续折行使用 continuationIndent
      current = continuationIndent + ch;
      isFirstLine = false;
      continue;
    }
    current += ch;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines.join('\n');
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
    const column = Number(cfg.autoHardWrapColumn || 0);
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

    // 仅当光标已在阈值之后，且当前行长度达到阈值时触发
    if (pos.character < column) { return; }
    if (line.text.length < column) { return; }

    // 已经在行尾（或接近行尾）时才硬换行，避免在行中间插入导致“断句”
    if (pos.character < line.text.length) { return; }

    const overallIndentToInsert = ' '.repeat(Math.max(0, cfg.overallIndent || 0));

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
