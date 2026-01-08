import * as vscode from 'vscode';
import { countWords, formatTime, calculateWritingSpeed, getCurrentTimestamp } from '../utils/helpers';
import { readConfig } from '../utils/config';

/** 统计管理器 */
export class StatsManager {
  private totalWordCount = 0;
  private totalEditTime = 0;
  private statsCommandDisposable: vscode.Disposable; // 新增：保存命令 disposable

  constructor(private context: vscode.ExtensionContext) {
    this.loadStats();
    this.statsCommandDisposable = this.startListening(); // 修改：接收返回的 disposable
    this.context.subscriptions.push(this.statsCommandDisposable);
  }

  /** 加载统计数据 */
  private loadStats(): void {
    const config = readConfig();
    this.totalEditTime = config.totalEditTime || 0;
  }

  /** 开始监听 */
  private startListening(): vscode.Disposable { // 修改：返回 disposable
    // 文档保存时更新总字数
    const saveDisposable = vscode.workspace.onDidSaveTextDocument(document => {
      const wordCount = countWords(document.getText());
      this.totalWordCount = wordCount;
      vscode.window.setStatusBarMessage(`已保存，当前总字数: ${this.totalWordCount}`, 3000);
    });

    // 显示统计信息命令
    const cmdDisposable = vscode.commands.registerCommand('novel-helper.showStats', () => {
      const config = readConfig();
      const currentTime = getCurrentTimestamp();
      const duration = currentTime - config.editStartTime;
      const speed = calculateWritingSpeed(this.totalWordCount, config.totalEditTime + duration);

      const statsMessage = `
📊 小说创作统计：
总字数：${this.totalWordCount}
总耗时：${formatTime(config.totalEditTime)}
平均速度：${speed} 字/分钟
      `;

      vscode.window.showInformationMessage(statsMessage);
    });

    return vscode.Disposable.from(saveDisposable, cmdDisposable);
  }

  /** 获取总字数 */
  public getTotalWordCount(): number {
    return this.totalWordCount;
  }

  /** 获取总耗时 */
  public getTotalEditTime(): number {
    return this.totalEditTime;
  }

  // 新增：实现 dispose 方法
  public dispose(): void {
    this.statsCommandDisposable.dispose();
  }
}