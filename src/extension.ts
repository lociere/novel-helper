import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerTreeView } from './treeView';
import { registerStatusBar } from './statusBar';
import { registerPanel } from './panel';
import { registerHighlighter } from './highlighter';
import { registerStats } from './stats';
import { registerFormatter } from './formatter';
import { hideConfigFileInExplorer } from './utils/config';
import { syncIndentGuidesSetting, syncWordWrapSetting } from './utils/editorSettings';

/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('novel-helper 已激活！');

  // 注册功能模块的辅助函数
  const registerModule = (name: string, registerFn: (ctx: vscode.ExtensionContext) => void) => {
    try {
      registerFn(context);
    } catch (e) {
      console.error(`[Novel Helper] register${name} 失败：`, e);
      vscode.window.showErrorMessage(`Novel Helper: 注册${name}失败，请查看开发者控制台。`);
    }
  };

  // 按顺序注册各模块
  registerModule('Commands', registerCommands);
  registerModule('TreeView', registerTreeView);
  registerModule('StatusBar', registerStatusBar);
  registerModule('Panel', registerPanel);
  registerModule('Highlighter', registerHighlighter);
  registerModule('Stats', registerStats);
  registerModule('Formatter', registerFormatter);

  // 隐藏工作区内的插件配置文件，避免干扰资源管理器视图
  try {
    hideConfigFileInExplorer();
  } catch (e) {
    // 忽略非关键错误
    console.warn('[Novel Helper] 隐藏配置文件失败:', e);
  }

  // 同步缩进参考线显示（避免出现竖线）
  void syncIndentGuidesSetting();
  // 同步 VS Code 自动换行列宽（可选）
  void syncWordWrapSetting();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('novel-helper.autoDisableIndentGuides')) {
        void syncIndentGuidesSetting();
      }
      if (
        e.affectsConfiguration('novel-helper.autoSyncWordWrapColumn')
        || e.affectsConfiguration('novel-helper.editorWordWrapColumn')
        || e.affectsConfiguration('novel-helper.autoHardWrapColumn')
      ) {
        void syncWordWrapSetting();
      }
    })
  );
}

/**
 * 扩展停用时执行
 */
export function deactivate(): void {
  console.log('novel-helper 已停用！');
}