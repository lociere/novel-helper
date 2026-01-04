import * as vscode from 'vscode';
import { getVSCodeConfig, readConfig, writeConfig } from '../utils/config';
import { getSelectedText } from '../utils/helpers';
import * as path from 'path';

/** 高亮管理器 */
export class Highlighter {
  private decorations: { [key: string]: vscode.TextEditorDecorationType } = {};
  private highlightItems: { [key: string]: { path: string; range: vscode.Range } } = {};
  // 修复：移除 empty() 初始化，改为构造函数内初始化
  private clickDisposable: vscode.Disposable;

  constructor(private context: vscode.ExtensionContext) {
    // 初始化空的Disposable（兼容所有VSCode版本）
    this.clickDisposable = new vscode.Disposable(() => {});
    this.initDecorations();
    this.startListening();
  }

  /** 初始化装饰器 */
  private initDecorations(): void {
    const config = getVSCodeConfig();
    this.decorations.highlight = vscode.window.createTextEditorDecorationType({
      backgroundColor: config.highlightColor,
      color: config.highlightTextColor,
      cursor: 'pointer',
      border: '1px solid #ccc',
      borderRadius: '2px'
    });
    this.context.subscriptions.push(this.decorations.highlight);
  }

  /** 开始监听 */
  private startListening(): void {
    // 监听选中文本，添加高亮项
    vscode.window.onDidChangeTextEditorSelection(async (event) => {
      const editor = event.textEditor;
      const selection = event.selections[0];
      if (!selection.isEmpty) {
        const text = getSelectedText();
        if (text && editor.document.uri.fsPath.includes('设定')) {
          // 确认添加高亮
          const confirm = await vscode.window.showQuickPick(['是', '否'], {
            placeHolder: `是否将"${text}"添加为高亮项？`
          });
          if (confirm === '是') {
            this.highlightItems[text] = {
              path: editor.document.uri.fsPath,
              range: selection
            };
            writeConfig({ highlightItems: this.highlightItems });
            vscode.window.showInformationMessage(`已添加高亮项: ${text}`);
            this.updateHighlights();
          }
        }
      }
    });

    // 文档变化时更新高亮
    vscode.workspace.onDidChangeTextDocument(() => {
      this.updateHighlights();
    });

    // 切换编辑器时更新高亮
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.updateHighlights();
      }
    });

    // 重新赋值 clickDisposable（替换空的Disposable）
    this.clickDisposable.dispose(); // 释放空的Disposable
    this.clickDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (!editor) return;

      const position = event.selections[0].active;
      const document = editor.document;

      // 遍历所有高亮项，检查当前位置是否在高亮范围内
      Object.keys(this.highlightItems).forEach(itemText => {
        const regex = new RegExp(itemText, 'g');
        const text = document.getText();
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + itemText.length);
          const highlightRange = new vscode.Range(startPos, endPos);

          // 如果当前点击位置在高亮范围内
          if (highlightRange.contains(position)) {
            const item = this.highlightItems[itemText];
            if (item) {
              // 打开设定文件并定位
              vscode.workspace.openTextDocument(vscode.Uri.file(item.path)).then(doc => {
                vscode.window.showTextDocument(doc).then(targetEditor => {
                  targetEditor.selection = new vscode.Selection(item.range.start, item.range.end);
                  targetEditor.revealRange(item.range, vscode.TextEditorRevealType.InCenter);
                });
              });
            }
            return; // 找到匹配项后退出循环
          }
        }
      });
    });
    this.context.subscriptions.push(this.clickDisposable);

    // 加载已保存的高亮项
    const config = readConfig();
    this.highlightItems = config.highlightItems || {};
  }

  /** 转义正则特殊字符 */
  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** 更新高亮 */
  private updateHighlights(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const text = editor.document.getText();
    const ranges: vscode.Range[] = [];

    // 匹配所有高亮项
    Object.keys(this.highlightItems).forEach(item => {
      const escapedText = this.escapeRegExp(item); // 先转义
      const regex = new RegExp(escapedText, 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = editor.document.positionAt(match.index);
        const end = editor.document.positionAt(match.index + item.length);
        ranges.push(new vscode.Range(start, end));
      }
    });

    // 应用装饰器
    editor.setDecorations(this.decorations.highlight, ranges);
  }

  // 实现 dispose 方法
  public dispose(): void {
    Object.values(this.decorations).forEach(deco => deco.dispose());
    this.clickDisposable.dispose();
  }
}