import * as vscode from 'vscode';
import { getVSCodeConfig, readConfig, writeConfig } from '../utils/config';
import { countWords, formatTime, calculateWritingSpeed, getCurrentTimestamp } from '../utils/helpers';

/** 状态栏管理器 */
export class StatusBarManager {
  private statusBarItems: { [key: string]: vscode.StatusBarItem } = {};
  private currentWordCount = 0;
  private editStartTime = 0;

  constructor(private context: vscode.ExtensionContext) {
    this.initStatusBarItems();
    this.startListening();
  }

  /** 初始化状态栏项 */
  private disposables: vscode.Disposable[] = [];

  private initStatusBarItems(): void {
    // 字数统计
    this.statusBarItems.wordCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItems.wordCount.command = 'novel-helper.openConfigPanel';
    this.statusBarItems.wordCount.tooltip = '点击打开配置面板';

    // 排版设置
    this.statusBarItems.format = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.statusBarItems.format.command = 'novel-helper.openConfigPanel';
    this.statusBarItems.format.tooltip = '点击打开配置面板';

    // 码字速度
    this.statusBarItems.speed = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    this.statusBarItems.speed.command = 'novel-helper.openConfigPanel';
    this.statusBarItems.speed.tooltip = '点击打开配置面板';

    // 码字时间
    this.statusBarItems.time = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    this.statusBarItems.time.command = 'novel-helper.openConfigPanel';
    this.statusBarItems.time.tooltip = '点击打开配置面板';

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
    const closeDocDisposable = vscode.workspace.onDidCloseTextDocument(() => {
      this.handleDocumentClose();
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

  /**
   * 处理编辑器激活/切换
   */
  private handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    if (!editor) { return; }
    
    this.editStartTime = getCurrentTimestamp();
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
      this.updateStatusBar(event.document);
    }
  }

  /**
   * 处理文档关闭（计算时长）
   */
  private handleDocumentClose(): void {
    const config = readConfig();
    const currentTime = getCurrentTimestamp();
    const duration = currentTime - config.editStartTime;
    writeConfig({ totalEditTime: config.totalEditTime + duration });
  }

  /** 更新状态栏 */
  public updateStatusBar(document: vscode.TextDocument): void {
    const config = getVSCodeConfig();
    const text = document.getText();
    this.currentWordCount = countWords(text);

    // 计算码字速度
    const currentTime = getCurrentTimestamp();
    const duration = currentTime - this.editStartTime; // 本次会话时长
    const wordChange = this.currentWordCount - config.lastWordCount; // 本次字数变化
    const speed = calculateWritingSpeed(wordChange, duration);

    this.updateStatusBarItem(this.statusBarItems.wordCount, `字数: ${this.currentWordCount}`);
    this.updateStatusBarItem(this.statusBarItems.format, `缩进: ${config.paragraphIndent} | 空行: ${config.lineSpacing}`);
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
    Object.values(this.statusBarItems).forEach(item => item.dispose());
    this.disposables.forEach(d => { try { d.dispose(); } catch { /* ignore */ } });
  }
}