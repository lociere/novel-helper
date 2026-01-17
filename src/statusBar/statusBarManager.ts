import * as vscode from 'vscode';
import { getVSCodeConfig, readConfig, writeConfig } from '../utils/config';
import { countWords, formatTime, calculateWritingSpeed } from '../utils/helpers';
import { isSupportedTextDocument } from '../utils/supportedDocuments';

type StatusBarKey = 'wordCount' | 'format' | 'speed' | 'time';
type StatusBarItems = Record<StatusBarKey, vscode.StatusBarItem>;

/** 状态栏管理器 */
export class StatusBarManager {
  private statusBarItems!: StatusBarItems;
  private currentWordCount = 0;
  private editStartTime = 0;
  private editingDocFsPath: string | undefined;

  private disposables: vscode.Disposable[] = [];

  constructor(private context: vscode.ExtensionContext) {
    this.initStatusBarItems();
    this.startListening();
  }

  private initStatusBarItems(): void {
    const items = {} as StatusBarItems;

    // 字数统计
    items.wordCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    items.wordCount.command = 'novel-helper.openConfigPanel';
    items.wordCount.tooltip = '点击打开配置面板';

    // 排版设置
    items.format = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    items.format.command = 'novel-helper.openConfigPanel';
    items.format.tooltip = '点击打开配置面板';

    // 码字速度
    items.speed = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    items.speed.command = 'novel-helper.openConfigPanel';
    items.speed.tooltip = '点击打开配置面板';

    // 码字时间
    items.time = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    items.time.command = 'novel-helper.openConfigPanel';
    items.time.tooltip = '点击打开配置面板';

    this.statusBarItems = items;

    // 注册到上下文
    Object.values(this.statusBarItems).forEach(item => {
      this.context.subscriptions.push(item);
    });
  }

  /** 开始监听文档变化 */
  private startListening(): void {
    // 1. 文档切换：更新开始时间并刷新状态
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
      this.handleActiveEditorChange(editor);
    });

    // 2. 文档内容变化：更新实时统计
    const changeDocDisposable = vscode.workspace.onDidChangeTextDocument(event => {
      this.handleDocumentChange(event);
    });

    // 3. 文档关闭：累计编辑时长
    const closeDocDisposable = vscode.workspace.onDidCloseTextDocument(doc => {
      this.handleDocumentClose(doc);
    });

    // 统一管理资源
    const disposables = [activeEditorDisposable, changeDocDisposable, closeDocDisposable];
    this.context.subscriptions.push(...disposables);
    this.disposables.push(...disposables);

    // 4. 插件启动时的初始化检查
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      this.handleActiveEditorChange(activeEditor);
    }
  }

  private commitSessionTime(): void {
    if (!this.editStartTime || this.editStartTime <= 0) { return; }
    const now = Date.now();
    const duration = now - this.editStartTime;
    if (!duration || duration <= 0) { return; }

    const cfg = readConfig();
    // 只累计“已开始的有效会话”，并写回总时长。
    writeConfig({ totalEditTime: cfg.totalEditTime + duration });
  }

  /**
   * 处理编辑器激活/切换
   */
  private handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    if (!editor) { return; }

    // 切换编辑器前，先结算上一段会话的时间（仅当上一会话确实在计时）
    this.commitSessionTime();

    // 仅对小说相关文本计时/统计
    if (!isSupportedTextDocument(editor.document)) {
      this.editStartTime = 0;
      this.editingDocFsPath = undefined;
      return;
    }

    this.editStartTime = Date.now();
    this.editingDocFsPath = editor.document.uri.fsPath;

    const wordCount = countWords(editor.document.getText());

    // 更新会话开始状态，用于计算本次速度
    writeConfig({
      editStartTime: this.editStartTime,
      lastWordCount: wordCount
    });

    this.updateStatusBar(editor.document);
  }

  /**
   * 处理文档内容变更
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const editor = vscode.window.activeTextEditor;
    // 仅当变更发生在当前激活的编辑器中才更新
    if (editor && event.document === editor.document) {
      if (!isSupportedTextDocument(event.document)) { return; }
      this.updateStatusBar(event.document);
    }
  }

  /**
   * 处理文档关闭（计算时长）
   */
  private handleDocumentClose(doc: vscode.TextDocument): void {
    // 仅当关闭的是当前计时的文档时，才结算并停止计时。
    if (!this.editingDocFsPath) { return; }
    if (doc.uri.fsPath !== this.editingDocFsPath) { return; }

    this.commitSessionTime();
    this.editStartTime = 0;
    this.editingDocFsPath = undefined;
  }

  /** 更新状态栏 */
  public updateStatusBar(document: vscode.TextDocument): void {
    if (!isSupportedTextDocument(document)) { return; }
    const config = getVSCodeConfig();
    const text = document.getText();
    this.currentWordCount = countWords(text);

    // 计算码字速度
    const currentTime = Date.now();
    const duration = this.editStartTime > 0 ? (currentTime - this.editStartTime) : 0; // 本次会话时长
    const wordChange = this.currentWordCount - config.lastWordCount; // 本次字数变化
    const speed = calculateWritingSpeed(wordChange, duration);

    this.updateStatusBarItem(this.statusBarItems.wordCount, `字数: ${this.currentWordCount}`);
    const formatText = [
      `缩进: ${config.paragraphIndent}`,
      `段间距: ${config.lineSpacing}`
    ].join(' | ');
    this.updateStatusBarItem(this.statusBarItems.format, formatText);
    this.updateStatusBarItem(this.statusBarItems.speed, `速度: ${speed} 字/分钟`);
    this.updateStatusBarItem(this.statusBarItems.time, `时长: ${formatTime(config.totalEditTime + duration)}`);
    
    // 保存最新字数状态，供下次计算差值
    writeConfig({ lastWordCount: this.currentWordCount });
  }

  /**
   * 辅助方法：更新状态栏项显示
   */
  private updateStatusBarItem(item: vscode.StatusBarItem, text: string): void {
    item.text = text;
    item.show();
  }

  /** 销毁状态栏项 */
  public dispose(): void {
    // 在模块卸载/扩展关闭时，尽量结算当前会话，避免丢失时长
    try { this.commitSessionTime(); } catch { /* ignore */ }
    Object.values(this.statusBarItems).forEach(item => item.dispose());
    this.disposables.forEach(d => { try { d.dispose(); } catch { /* ignore */ } });
  }
}