import * as vscode from 'vscode';
import { getVSCodeConfig } from '../config';
import { TEXT_DOCUMENT_SELECTORS } from '../utils/supportedDocuments';
import { formatText } from './formatCore';
import { buildFormatConfig } from './formatConfigBuilder';

export { formatText, type FormatConfig } from './formatCore';

/** 格式化管理器 */
export class Formatter implements vscode.Disposable {
  private disposable: vscode.Disposable;

  constructor() {
    this.disposable = this.registerFormatter();
  }

  private registerFormatter(): vscode.Disposable {
    const formatterProvider: vscode.DocumentFormattingEditProvider = {
      provideDocumentFormattingEdits: (document: vscode.TextDocument): vscode.TextEdit[] => {
        const cfg = getVSCodeConfig();
        const text = document.getText();
        
        // 使用 formatCore 和 buildFormatConfig 处理文本
        const formatConfig = buildFormatConfig(cfg);
        const newText = formatText(text, formatConfig);

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );

        return [vscode.TextEdit.replace(fullRange, newText)];
      }
    };

    return vscode.languages.registerDocumentFormattingEditProvider(
      TEXT_DOCUMENT_SELECTORS,
      formatterProvider
    );
  }

  public dispose(): void {
    this.disposable.dispose();
  }
}
