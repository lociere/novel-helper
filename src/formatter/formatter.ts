import * as vscode from 'vscode';
import { getVSCodeConfig } from '../utils/config';

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
        const config = getVSCodeConfig();
        const text = document.getText();
        
        // 1. 提取有效段落（处理掉所有原有空行和首尾空格）
        const paragraphs = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

        if (paragraphs.length === 0) {
          // 如果全是空行，清空文档
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
          );
          return [vscode.TextEdit.replace(fullRange, '')];
        }

        // 2. 确定分隔符
        // config.lineSpacing 表示段落间的“空行数”
        // 0 => 换行 (\n)
        // 1 => 换行+空一行 (\n\n)
        const separator = '\n'.repeat(Math.max(1, config.lineSpacing + 1));
        const indentString = ' '.repeat(config.paragraphIndent);

        // 3. 重新组装文档
        const newText = paragraphs.map(p => indentString + p).join(separator);

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