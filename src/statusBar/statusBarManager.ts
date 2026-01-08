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
    // 文档打开时初始化
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        this.editStartTime = getCurrentTimestamp();
        const config = readConfig();
        writeConfig({ editStartTime: this.editStartTime, lastWordCount: countWords(editor.document.getText()) });
        this.updateStatusBar(editor.document);
      }
    });

    // 文档内容变化时更新
    const changeDocDisposable = vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        this.updateStatusBar(event.document);
      }
    });

    // 文档关闭时更新累计时间
    const closeDocDisposable = vscode.workspace.onDidCloseTextDocument(document => {
      const config = readConfig();
      const currentTime = getCurrentTimestamp();
      const duration = currentTime - config.editStartTime;
      writeConfig({ totalEditTime: config.totalEditTime + duration });
    });

    // 统一管理 disposables
    this.context.subscriptions.push(activeEditorDisposable, changeDocDisposable, closeDocDisposable);
    this.disposables.push(activeEditorDisposable, changeDocDisposable, closeDocDisposable);
  }

  /** 更新状态栏 */
  public updateStatusBar(document: vscode.TextDocument): void {
    const config = getVSCodeConfig();
    const text = document.getText();
    this.currentWordCount = countWords(text);

    // 计算码字速度
    const currentTime = getCurrentTimestamp();
    const duration = currentTime - this.editStartTime;
    const wordChange = this.currentWordCount - config.lastWordCount;
    const speed = calculateWritingSpeed(wordChange, duration);

    // 更新字数
    this.statusBarItems.wordCount.text = `字数: ${this.currentWordCount}`;
    this.statusBarItems.wordCount.show();

    // 更新排版设置
    this.statusBarItems.format.text = `缩进: ${config.paragraphIndent} | 空行: ${config.lineSpacing}`;
    this.statusBarItems.format.show();

    // 更新码字速度
    this.statusBarItems.speed.text = `速度: ${speed} 字/分钟`;
    this.statusBarItems.speed.show();

    // 更新码字时间
    const totalTime = config.totalEditTime + duration;
    this.statusBarItems.time.text = `耗时: ${formatTime(totalTime)}`;
    this.statusBarItems.time.show();

    // 保存最新字数
    writeConfig({ lastWordCount: this.currentWordCount });
  }

  /** 销毁状态栏项 */
  public dispose(): void {
    Object.values(this.statusBarItems).forEach(item => item.dispose());
    this.disposables.forEach(d => { try { d.dispose(); } catch (e) { /* ignore */ } });
  }
}