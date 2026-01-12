import * as vscode from 'vscode';
import { readConfig, writeConfig } from '../utils/config';

/**
 * 文本高亮管理器（优化版：性能提升+错误处理）
 */
export class Highlighter {
  private decorations: { [key: string]: vscode.TextEditorDecorationType };
  private highlightItems: { [key: string]: { path: string; range: vscode.Range } };
  private regexCache: Map<string, RegExp>; // 正则缓存：避免重复创建

  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    const cfg = readConfig();
    const initialColor = cfg.highlightColor || '#FFD700';
    this.decorations = {
      highlight: vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        // 仅修改文字颜色，不改变背景，移除下划线
        color: initialColor,
        textDecoration: 'none'
      })
    };

    this.highlightItems = {};
    this.regexCache = new Map<string, RegExp>(); // 初始化正则缓存

    // 从配置中加载持久化的高亮
    try {
      const cfg = readConfig();
      const items = cfg.highlightItems || {};
      Object.keys(items).forEach(key => {
        const v = items[key];
        try {
          const range = new vscode.Range(
            new vscode.Position(v.range.start.line, v.range.start.character),
            new vscode.Position(v.range.end.line, v.range.end.character)
          );
          this.highlightItems[key] = { path: v.path, range };
        } catch (e) {
          // 忽略解析错误
          console.warn('[Novel Helper] 解析高亮位置失败：', key, e);
        }
      });
    } catch (e) {
      console.warn('[Novel Helper] 读取高亮配置失败：', e);
    }

    // 注册高亮相关命令
    this.registerCommands(context);
    // 监听文本变化更新高亮
    this.registerEventListeners(context);
    // 注册定义提供器，支持 Ctrl+点击跳转
    this.registerDefinitionProvider(context);
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

      // 序列化范围并写入配置，确保关闭后重开依然生效
      const serialRange = {
        start: { line: selection.start.line, character: selection.start.character },
        end: { line: selection.end.line, character: selection.end.character }
      };
      const cfg = readConfig();
      const newItems = { ...(cfg.highlightItems || {}), [text]: { path: editor.document.uri.fsPath, range: serialRange } };
      writeConfig({ highlightItems: newItems });

      this.highlightItems[text] = {
        path: editor.document.uri.fsPath,
        range: selection
      };
      this.updateHighlights();
      vscode.window.showInformationMessage(`已添加高亮项：${text}`);
    });

    context.subscriptions.push(addHighlightDisposable);

    // 从设定文件中添加高亮（会持久化）
    const addFromSettingDisposable = vscode.commands.registerCommand('novel-helper.addHighlightFromSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('请先打开文本编辑器！');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('请先在设定文件中选中要高亮的文本！');
        return;
      }

      const text = editor.document.getText(selection).trim();
      if (!text) {
        vscode.window.showWarningMessage('高亮文本不能为空！');
        return;
      }

      // 序列化范围并写入配置
      const serialRange = {
        start: { line: selection.start.line, character: selection.start.character },
        end: { line: selection.end.line, character: selection.end.character }
      };

      const cfg = readConfig();
      const newItems = { ...(cfg.highlightItems || {}), [text]: { path: editor.document.uri.fsPath, range: serialRange } };
      writeConfig({ highlightItems: newItems });

      // 更新内存并刷新高亮
      this.highlightItems[text] = { path: editor.document.uri.fsPath, range: selection };
      this.updateHighlights();
      vscode.window.showInformationMessage(`已为“${text}”添加高亮并保存到设定`);
    });

    context.subscriptions.push(addFromSettingDisposable);

    // 跳转到高亮源文件
    const jumpDisposable = vscode.commands.registerCommand('novel-helper.jumpToHighlightSource', async (arg?: any) => {
      const cfg = readConfig();
      const items = cfg.highlightItems || {};
      const keys = Object.keys(items);
      
      if (keys.length === 0) {
        vscode.window.showInformationMessage('未找到任何高亮设定');
        return;
      }

      let selectedKey: string | undefined;

      // 1. 如果参数是字符串，直接使用（可能是从代码调用）
      if (typeof arg === 'string') {
        selectedKey = arg;
      } 
      // 2. 尝试从当前编辑器选区或光标位置获取
      else {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          // 优先检查选区
          const selectionText = editor.document.getText(editor.selection).trim();
          if (selectionText && items[selectionText]) {
            selectedKey = selectionText;
          } 
          // 其次检查光标下的单词
          else {
            const range = editor.document.getWordRangeAtPosition(editor.selection.active);
            if (range) {
              const word = editor.document.getText(range).trim();
              if (items[word]) {
                selectedKey = word;
              }
            }
          }
        }
      }

      // 3. 如果仍未确定key，则显示选择列表
      if (!selectedKey) {
        selectedKey = await vscode.window.showQuickPick(keys, { placeHolder: '选择要跳转的高亮项' });
      }
      
      if (!selectedKey) { return; }

      const hi = items[selectedKey];
      if (!hi) {
        vscode.window.showErrorMessage(`未找到“${selectedKey}”的高亮源信息`);
        return;
      }

      try {
        const doc = await vscode.workspace.openTextDocument(hi.path);
        const ed = await vscode.window.showTextDocument(doc);
        const range = new vscode.Range(
          new vscode.Position(hi.range.start.line, hi.range.start.character),
          new vscode.Position(hi.range.end.line, hi.range.end.character)
        );
        ed.revealRange(range, vscode.TextEditorRevealType.InCenter);
        ed.selection = new vscode.Selection(range.start, range.end);
      } catch (err) {
        console.error('[Novel Helper] 跳转到高亮源失败：', err);
        vscode.window.showErrorMessage('打开高亮源文件失败');
      }
    });

    context.subscriptions.push(jumpDisposable);

    // 移除高亮
    const removeDisposable = vscode.commands.registerCommand('novel-helper.removeHighlight', async (arg?: any) => {
      const cfg = readConfig();
      const items = cfg.highlightItems || {};
      const keys = Object.keys(items);

      if (keys.length === 0) {
        vscode.window.showInformationMessage('当前没有设置任何高亮');
        return;
      }

      let selectedKey: string | undefined;

      // 1. 如果参数是字符串，直接使用
      if (typeof arg === 'string') {
        selectedKey = arg;
      } 
      // 2. 尝试从当前编辑器选区或光标位置获取
      else {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const selectionText = editor.document.getText(editor.selection).trim();
          if (selectionText && items[selectionText]) {
            selectedKey = selectionText;
          } else {
            const range = editor.document.getWordRangeAtPosition(editor.selection.active);
            if (range) {
              const word = editor.document.getText(range).trim();
              if (items[word]) {
                selectedKey = word;
              }
            }
          }
        }
      }

      // 3. 如果未确定，显示列表供选择
      if (!selectedKey) {
        selectedKey = await vscode.window.showQuickPick(keys, { placeHolder: '选择要移除的高亮项' });
      }

      if (!selectedKey) { return; }

      // 执行删除
      delete items[selectedKey];
      writeConfig({ highlightItems: items });

      // 更新内存
      delete this.highlightItems[selectedKey];
      this.regexCache.delete(selectedKey);
      this.updateHighlights();

      vscode.window.showInformationMessage(`已移除高亮：“${selectedKey}”`);
    });

    context.subscriptions.push(removeDisposable);
  }

  /**
   * 注册事件监听器（优化：添加防抖减少高频触发）
   */
  private registerEventListeners(context: vscode.ExtensionContext): void {
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
    const docDisposable = vscode.workspace.onDidChangeTextDocument(() => {
      debouncedUpdate();
    });

    // 切换编辑器时更新高亮（防抖）
    const editorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
      debouncedUpdate();
    });

    context.subscriptions.push(docDisposable, editorDisposable);
    this.disposables.push(docDisposable, editorDisposable);

    // 监听可见编辑器变化（处理分屏等多编辑器情况）
    const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(() => {
      debouncedUpdate();
    });
    context.subscriptions.push(visibleEditorsDisposable);
    this.disposables.push(visibleEditorsDisposable);

    // 监听配置变化以便动态更新高亮颜色（例如通过配置面板修改）
    const configDisposable = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('novel-helper.highlightColor')) {
        try {
          this.recreateDecoration();
        } catch {
          // 忽略重建错误
        }
        this.updateHighlights();
      }
    });
    context.subscriptions.push(configDisposable);
    this.disposables.push(configDisposable);

    // 初始化时立即更新所有可见编辑器的高亮
    this.updateHighlights();
  }

  /**
   * 注册定义提供器：支持 Ctrl+点击高亮文本跳转到源位置
   */
  private registerDefinitionProvider(context: vscode.ExtensionContext): void {
    const provider = vscode.languages.registerDefinitionProvider({ scheme: 'file' }, {
      provideDefinition: (document, position) => {
        const fullText = document.getText();

        for (const key of Object.keys(this.highlightItems)) {
          const hi = this.highlightItems[key];
          if (!hi || !hi.path) { continue; }

          const ranges = this.calculateItemRanges(key, document, fullText);
          const hit = ranges.find(r => r.contains(position));
          if (!hit) { continue; }

          const targetRange = this.getPersistedRange(hi.range) || hit;
          const targetUri = vscode.Uri.file(hi.path);

          const link: vscode.DefinitionLink = {
            originSelectionRange: hit,
            targetUri,
            targetRange
          };

          return [link];
        }

        return [];
      }
    });

    context.subscriptions.push(provider);
    this.disposables.push(provider);
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
   * 更新所有可见编辑器的高亮
   */
  private updateHighlights(): void {
    // 遍历所有可见编辑器，而不仅仅是 activeTextEditor
    vscode.window.visibleTextEditors.forEach(editor => {
      this.updateEditorHighlights(editor);
    });
  }

  /**
   * 更新单个编辑器的高亮
   */
  private updateEditorHighlights(editor: vscode.TextEditor): void {
    if (!editor || !editor.document) {
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    Object.keys(this.highlightItems).forEach(item => {
      // 跳过空高亮项
      if (!item || item.trim() === '') {
        return;
      }

      try {
        const itemRanges = this.calculateItemRanges(item, document, text);
        this.mergeRanges(decorations, itemRanges);
      } catch (error) {
        console.error(`[Novel Helper] 高亮匹配失败 - 项：${item}`, error);
        // 移除错误的高亮项，避免持续报错
        delete this.highlightItems[item];
        this.regexCache.delete(item);
      }
    });

    // 应用装饰器
    editor.setDecorations(this.decorations.highlight, decorations);
  }

  /**
   * 计算单个高亮项的所有匹配范围
   */
  private calculateItemRanges(itemKey: string, document: vscode.TextDocument, fullText: string): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const hi = this.highlightItems[itemKey];
    
    // 1. 如果当前文档就是源文件，优先使用持久化的范围
    if (hi && hi.path && document.uri.fsPath === hi.path) {
      const sourceRange = this.getPersistedRange(hi.range);
      if (sourceRange) {
        ranges.push(sourceRange);
      }
    }

    // 2. 确定搜索用的文本关键字
    let searchText = itemKey;
    // 如果能从源文件读取到最新文本，优先使用
    if (hi && hi.path && document.uri.fsPath === hi.path && hi.range instanceof vscode.Range) {
      try {
        const actual = document.getText(hi.range).trim();
        if (actual) { searchText = actual; }
      } catch {
        // ignore
      }
    }

    // 3. 正则全局匹配
    const regex = this.getOrUpdateRegex(searchText);
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(fullText)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const newRange = new vscode.Range(startPos, endPos);
      
      ranges.push(newRange);
    }

    return ranges;
  }

  /**
   * 将新范围合并到结果列表（简单的去重）
   */
  private mergeRanges(target: vscode.DecorationOptions[], source: vscode.Range[]): void {
    const hover = new vscode.MarkdownString('按住 Ctrl 点击跳转到源位置');
    hover.isTrusted = false;

    source.forEach(newRange => {
      const exists = target.some(opt => opt.range.start.isEqual(newRange.start) && opt.range.end.isEqual(newRange.end));
      if (exists) { return; }
      target.push({
        range: newRange,
        hoverMessage: hover
      });
    });
  }

  /**
   * 获取或转换持久化的 Range 对象
   */
  private getPersistedRange(range: any): vscode.Range | null {
    try {
      if (range instanceof vscode.Range) {
        return range;
      }
      return new vscode.Range(
        new vscode.Position(range.start.line, range.start.character),
        new vscode.Position(range.end.line, range.end.character)
      );
    } catch {
      return null;
    }
  }

  /**
   * 获取或创建正则表达式（带缓存）
   */
  private getOrUpdateRegex(text: string): RegExp {
    let regex = this.regexCache.get(text);
    if (!regex) {
      const escapedItem = this.escapeRegExp(text);
      regex = new RegExp(escapedItem, 'g');
      this.regexCache.set(text, regex);
    }
    return regex;
  }

  /**
   * 重新创建装饰器（用于配置变更时更新颜色）
   */
  private recreateDecoration(): void {
    try { this.decorations.highlight.dispose(); } catch { /* ignore */ }
    const cfg = readConfig();
    const color = cfg.highlightColor || '#FFD700';
    this.decorations.highlight = vscode.window.createTextEditorDecorationType({
      isWholeLine: false,
      color,
      textDecoration: 'none'
    });
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 清理所有注册的 disposables
    this.disposables.forEach(d => {
      try { d.dispose(); } catch { /* ignore */ }
    });

    // 销毁装饰器
    Object.keys(this.decorations).forEach(k => {
      try { this.decorations[k].dispose(); } catch { /* ignore */ }
    });
  }
}

/**
 * 注册高亮管理器
 * @param context 扩展上下文
 */
export const registerHighlighter = (context: vscode.ExtensionContext): void => {
  new Highlighter(context);
};