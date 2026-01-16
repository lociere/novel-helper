import * as vscode from 'vscode';
import { getVSCodeConfig } from '../utils/config';

import { formatText } from './formatCore';
export { formatText, type FormatConfig } from './formatCore';

/** 格式化管理器 */
export class Formatter {
  private disposable: vscode.Disposable; // 新增：保存注册的格式化程序

  constructor(private context: vscode.ExtensionContext) {
    this.disposable = this.registerFormatter(); // 修改：接收返回的 disposable
    this.context.subscriptions.push(this.disposable);
  }

  /** 注册格式化程序 */
  private registerFormatter(): vscode.Disposable { // 修改：返回 disposable
    // 注册文档格式化程序
    const formatterProvider: vscode.DocumentFormattingEditProvider = {
      provideDocumentFormattingEdits: (document: vscode.TextDocument): vscode.TextEdit[] => {
        const cfg = getVSCodeConfig();
        const text = document.getText();

        const newText = formatText(text, {
          paragraphIndent: cfg.paragraphIndent,
          overallIndent: cfg.overallIndent,
          lineSpacing: cfg.lineSpacing,
          intraLineSpacing: cfg.intraLineSpacing,
          paragraphSplitMode: cfg.paragraphSplitMode,
          paragraphSplitOnIndentedLine: cfg.paragraphSplitOnIndentedLine,
          useFullWidthIndent: cfg.useFullWidthIndent
        });

        // 4. 全量替换（确保彻底符合格式）
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );

        return [vscode.TextEdit.replace(fullRange, newText)];
      }
    };

    // 注册格式化程序并返回 disposable
    return vscode.languages.registerDocumentFormattingEditProvider(
      [{ scheme: 'file', language: 'plaintext' }, { scheme: 'file', language: 'markdown' }],
      formatterProvider
    );
  }

  // 新增：实现 dispose 方法
  public dispose(): void {
    this.disposable.dispose();
  }
}