import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerTreeView } from './treeView';
import { registerStatusBar } from './statusBar';
import { registerPanel } from './panel';
import { registerHighlighter } from './highlighter';
import { registerFormatter } from './formatter';
import { hideConfigFileInExplorer, isWorkspaceInitialized } from './utils/config';
import { syncIndentGuidesSetting, syncWordWrapSetting } from './utils/editorSettings';
import { addFeatureDisposable, disposeAllFeatures } from './utils/featureRegistry';

/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('novel-helper 已激活！');

  const initialized = isWorkspaceInitialized();
  void vscode.commands.executeCommand('setContext', 'novelHelper.initialized', initialized);
  let featuresRegistered = false;

  const registerModule = (name: string, registerFn: (ctx: vscode.ExtensionContext) => vscode.Disposable | void) => {
    try {
      const d = registerFn(context);
      if (d) { addFeatureDisposable(d); }
    } catch (e) {
      console.error(`[Novel Helper] register${name} 失败：`, e);
      vscode.window.showErrorMessage(`Novel Helper: 注册${name}失败，请查看开发者控制台。`);
    }
  };

  const registerFeatures = () => {
    if (featuresRegistered) { return; }
    featuresRegistered = true;

    registerModule('TreeView', registerTreeView);
    registerModule('StatusBar', registerStatusBar);
    registerModule('Panel', registerPanel);
    registerModule('Highlighter', registerHighlighter);
    registerModule('Formatter', registerFormatter);

    try {
      hideConfigFileInExplorer();
    } catch (e) {
      console.warn('[Novel Helper] 隐藏配置文件失败:', e);
    }

    const cfgListener = vscode.workspace.onDidChangeConfiguration(e => {
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
    });
    addFeatureDisposable(cfgListener);

    void syncIndentGuidesSetting();
    void syncWordWrapSetting();
  };

  const unregisterFeatures = () => {
    disposeAllFeatures();
    featuresRegistered = false;
  };

  // 始终注册命令（内部已对未初始化场景做提示/限制），并传入回调以便初始化后补注册功能，关闭时卸载
  registerModule('Commands', ctx => registerCommands(ctx, {
    onInitialized: registerFeatures,
    onClosed: unregisterFeatures
  }));

  if (initialized) {
    registerFeatures();
  } else {
    console.log('novel-helper：检测到工作区未初始化，仅注册命令模块。');
  }
}

/**
 * 扩展停用时执行
 */
export function deactivate(): void {
  console.log('novel-helper 已停用！');
  // 确保停用时清理功能模块
  try { disposeAllFeatures(); } catch { /* ignore */ }
}