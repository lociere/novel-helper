import * as vscode from 'vscode';
import { getVSCodeConfig } from '../utils/config';
import { TEXT_DOCUMENT_SELECTORS } from '../utils/supportedDocuments';

import { formatDocumentText } from './formatService';
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

        const newText = formatDocumentText(document, cfg);

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
      TEXT_DOCUMENT_SELECTORS,
      formatterProvider
    );
  }

  // 新增：实现 dispose 方法
  public dispose(): void {
    this.disposable.dispose();
  }
}