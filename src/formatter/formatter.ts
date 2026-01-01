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
        const edits: vscode.TextEdit[] = [];
        const lines = document.getText().split('\n');
        let lastLineWasEmpty = false;

        lines.forEach((line, lineNumber) => {
          const range = document.lineAt(lineNumber).range;

          // 处理段首缩进
          let formattedLine = line;
          if (line.trim() !== '' && !lastLineWasEmpty) {
            // 非空行且上一行不是空行，添加段首缩进
            formattedLine = ' '.repeat(config.paragraphIndent) + line;
          }

          // 处理行间空行
          if (line.trim() === '') {
            lastLineWasEmpty = true;
            // 只保留配置的空行数
            if (config.lineSpacing === 0) {
              edits.push(vscode.TextEdit.delete(range));
              return;
            }
          } else {
            lastLineWasEmpty = false;
          }

          // 应用修改
          if (formattedLine !== line) {
            edits.push(vscode.TextEdit.replace(range, formattedLine));
          }
        });

        return edits;
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