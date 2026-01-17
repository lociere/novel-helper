import * as vscode from 'vscode';
import { getVSCodeConfig } from '../config';
import { shouldSkipFormatLine } from '../formatter/formattingUtils';
import { isSupportedTextDocument } from '../utils/supportedDocuments';

/**
 * 自动排版管理器。
 *
 * 功能：在用户按回车创建“新段落”时，自动插入段间空行与段首缩进。
 * - 段间空行数：novel-helper.lineSpacing
 * - 缩进：novel-helper.overallIndent + novel-helper.paragraphIndent
 *
 * 说明：
 * - 仅处理文本类文件（plaintext/markdown），且仅在单光标输入时生效。
 * - 若回车发生在行中间（新行会带内容），则不处理以避免破坏原文。
 * - 若上一行是标题等“跳过格式化”的语法行（如 #），则不处理。
 */
export class AutoLayoutManager implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private isApplying = false;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => this.onChange(e)),
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.isApplying = false;
      })
    );

    this.context.subscriptions.push(...this.disposables);
  }

  private onChange(event: vscode.TextDocumentChangeEvent): void {
    if (this.isApplying) { return; }

    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }
    if (editor.document !== event.document) { return; }
    if (!isSupportedTextDocument(editor.document)) { return; }

    const cfg = getVSCodeConfig();
    if (!cfg.autoLayoutOnEnter) { return; }

    if (editor.selections.length !== 1) { return; }

    // VS Code Enter 行为可能会插入 "\n" + 自动缩进空白，或拆成多条 change。
    // 这里匹配“仅包含一次换行，剩余全是空白”的那条 change。
    const enterChange = event.contentChanges.find(c => {
      if (!c.text) { return false; }
      if (!c.text.includes('\n')) { return false; }
      return /^\r?\n[\t ]*$/.test(c.text);
    });
    if (!enterChange) { return; }

    const newlineCount = (enterChange.text.match(/\n/g) || []).length;
    if (newlineCount !== 1) { return; }

    const prevLineIndex = enterChange.range.start.line;
    const newLineIndex = prevLineIndex + 1;
    if (newLineIndex >= editor.document.lineCount) { return; }

    const prevLineText = editor.document.lineAt(prevLineIndex).text;
    const newLineText = editor.document.lineAt(newLineIndex).text;

    // 回车在行中间：新行带内容，不自动排版
    if (newLineText.trim().length !== 0) { return; }

    // 空行回车：不自动插入，避免越插越多
    if (!prevLineText.trim()) { return; }

    // 标题/语法行后回车：不自动缩进/段间距
    if (shouldSkipFormatLine(prevLineText)) { return; }

    const indentChar = cfg.useFullWidthIndent ? '\u3000' : ' ';
    const overallIndent = indentChar.repeat(Math.max(0, cfg.overallIndent || 0));
    const paragraphIndent = indentChar.repeat(Math.max(0, cfg.paragraphIndent || 0));
    const firstLineIndent = overallIndent + paragraphIndent;

    const paragraphBlankLines = Math.max(0, Number(cfg.lineSpacing || 0));
    const extraNewlines = paragraphBlankLines > 0 ? '\n'.repeat(paragraphBlankLines) : '';

    this.isApplying = true;
    editor.edit(editBuilder => {
      // 新行可能已有自动缩进空白：用 replace 避免叠加。
      const start = new vscode.Position(newLineIndex, 0);
      const end = new vscode.Position(newLineIndex, newLineText.length);
      editBuilder.replace(new vscode.Range(start, end), extraNewlines + firstLineIndent);
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
