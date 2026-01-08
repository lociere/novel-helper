import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerTreeView } from './treeView';
import { registerStatusBar } from './statusBar';
import { registerPanel } from './panel';
import { registerHighlighter } from './highlighter';
import { registerStats } from './stats';
import { registerFormatter } from './formatter';
import { hideConfigFileInExplorer } from './utils/config';

/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('novel-helper 已激活！');

  // 注册所有模块
  try {
    registerCommands(context);
  } catch (e) {
    console.error('[Novel Helper] registerCommands 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册命令失败，请查看开发者控制台。');
  }

  try {
    registerTreeView(context);
  } catch (e) {
    console.error('[Novel Helper] registerTreeView 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册树视图失败，请查看开发者控制台。');
  }

  // 隐藏工作区内的插件配置文件，避免干扰资源管理器视图
  try {
    hideConfigFileInExplorer();
  } catch (e) {
    // 忽略
  }

  try {
    registerStatusBar(context);
  } catch (e) {
    console.error('[Novel Helper] registerStatusBar 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册状态栏失败，请查看开发者控制台。');
  }

  try {
    registerPanel(context);
  } catch (e) {
    console.error('[Novel Helper] registerPanel 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册面板失败，请查看开发者控制台。');
  }

  try {
    registerHighlighter(context);
  } catch (e) {
    console.error('[Novel Helper] registerHighlighter 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册高亮失败，请查看开发者控制台。');
  }

  try {
    registerStats(context);
  } catch (e) {
    console.error('[Novel Helper] registerStats 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册统计器失败，请查看开发者控制台。');
  }

  try {
    registerFormatter(context);
  } catch (e) {
    console.error('[Novel Helper] registerFormatter 失败：', e);
    vscode.window.showErrorMessage('Novel Helper: 注册格式化器失败，请查看开发者控制台。');
  }
}

/**
 * 扩展停用时执行
 */
export function deactivate(): void {
  console.log('novel-helper 已停用！');
}