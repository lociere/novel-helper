import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 文本高亮管理器（优化版：性能提升+错误处理）
 */
export class Highlighter {
  private decorations: { [key: string]: vscode.TextEditorDecorationType };
  private highlightItems: { [key: string]: { path: string; range: vscode.Range } };
  private regexCache: Map<string, RegExp>; // 正则缓存：避免重复创建

  constructor(context: vscode.ExtensionContext) {
    this.decorations = {
      highlight: vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        className: 'novel-highlight'
      })
    };

    this.highlightItems = {};
    this.regexCache = new Map<string, RegExp>(); // 初始化正则缓存

    // 注册高亮相关命令
    this.registerCommands(context);
    // 监听文本变化更新高亮
    this.registerEventListeners();
  }

  /**
   * 注册高亮相关命令
   */
  private registerCommands(context: vscode.ExtensionContext): void {
    // 添加高亮项命令
    const addHighlightDisposable = vscode.commands.registerCommand('novel-helper.addHighlight', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('请先打开文本编辑器！');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('请先选中要高亮的文本！');
        return;
      }

      const text = editor.document.getText(selection).trim();
      if (!text) {
        vscode.window.showWarningMessage('高亮文本不能为空！');
        return;
      }

      this.highlightItems[text] = {
        path: editor.document.uri.fsPath,
        range: selection
      };
      this.updateHighlights();
      vscode.window.showInformationMessage(`已添加高亮项：${text}`);
    });

    context.subscriptions.push(addHighlightDisposable);
  }

  /**
   * 注册事件监听器（优化：添加防抖减少高频触发）
   */
  private registerEventListeners(): void {
    // 防抖函数：300ms内仅执行一次，减少性能消耗
    const debounceUpdate = (func: () => void, delay: number) => {
      let timeout: NodeJS.Timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(), delay);
      };
    };

    // 防抖后的更新方法
    const debouncedUpdate = debounceUpdate(() => this.updateHighlights(), 300);

    // 文本变化时更新高亮（防抖）
    vscode.workspace.onDidChangeTextDocument(() => {
      debouncedUpdate();
    });

    // 切换编辑器时更新高亮（防抖）
    vscode.window.onDidChangeActiveTextEditor(() => {
      debouncedUpdate();
    });
  }

  /**
   * 转义正则特殊字符（避免正则语法错误）
   * @param str 原始字符串
   * @returns 转义后的字符串
   */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 更新文本高亮（优化：缓存正则+错误处理+有效性检查）
   */
  private updateHighlights(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const ranges: vscode.Range[] = [];

    // 匹配所有高亮项
    Object.keys(this.highlightItems).forEach(item => {
      // 跳过空高亮项
      if (!item || item.trim() === '') {
        return;
      }

      try {
        // 从缓存获取正则，无则创建并缓存
        let regex = this.regexCache.get(item);
        if (!regex) {
          const escapedItem = this.escapeRegExp(item);
          regex = new RegExp(escapedItem, 'g');
          this.regexCache.set(item, regex);
        }

        let match;
        // 重置正则lastIndex，避免匹配位置错误
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + item.length);
          
          // 验证位置有效性，避免无效range
          if (startPos.isValid && endPos.isValid) {
            ranges.push(new vscode.Range(startPos, endPos));
          }
        }
      } catch (error) {
        console.error(`[Novel Helper] 高亮匹配失败 - 项：${item}`, error);
        // 移除错误的高亮项，避免持续报错
        delete this.highlightItems[item];
        this.regexCache.delete(item);
      }
    });

    // 应用装饰器
    editor.setDecorations(this.decorations.highlight, ranges);
  }
}

/**
 * 注册高亮管理器
 * @param context 扩展上下文
 */
export const registerHighlighter = (context: vscode.ExtensionContext): void => {
  new Highlighter(context);
};