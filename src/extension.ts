import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerTreeView } from './treeView';
import { registerStatusBar } from './statusBar';
import { registerPanel } from './panel';
import { registerHighlighter } from './highlighter';
import { registerFormatter } from './formatter';
import { registerEditorBehavior } from './editorBehavior';
import { ensureConfigLoaded, flushConfigWrites, hideConfigFileInExplorer, isWorkspaceInitialized, registerConfigFileWatcher } from './utils/config';
import { syncAllEditorSettings } from './utils/editorSettings';
import { addFeatureDisposable, disposeAllFeatures } from './utils/featureRegistry';

/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('novel-helper 已激活！');

  // 先加载配置文件：避免后续读默认值覆盖真实配置。
  // 激活函数保持同步签名，但内部用 void + then，避免阻塞 VS Code 激活。
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
    registerModule('EditorBehavior', registerEditorBehavior);

    try {
      hideConfigFileInExplorer();
    } catch (e) {
      console.warn('[Novel Helper] 隐藏配置文件失败:', e);
    }

    const cfgListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (
        e.affectsConfiguration('novel-helper.autoDisableIndentGuides')
        || e.affectsConfiguration('novel-helper.editorWordWrapColumn')
        || e.affectsConfiguration('novel-helper.editorLineHeight')
      ) {
        void syncAllEditorSettings();
      }
    });
    addFeatureDisposable(cfgListener);

    void syncAllEditorSettings();
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

  const refreshInitContext = () => {
    const initialized = isWorkspaceInitialized();
    void vscode.commands.executeCommand('setContext', 'novelHelper.initialized', initialized);
    if (initialized) {
      registerFeatures();
    }
  };

  // 监听配置文件变化：确保外部编辑/删除后 Context 与功能模块状态一致。
  addFeatureDisposable(registerConfigFileWatcher(refreshInitContext));

  // 初始化判断依赖配置加载：等待 ensureConfigLoaded 后再决定是否注册功能模块。
  void ensureConfigLoaded().then(() => {
    refreshInitContext();
    if (!isWorkspaceInitialized()) {
      console.log('novel-helper：检测到工作区未初始化，仅注册命令模块。');
    }
  });
}

/**
 * 扩展停用时执行
 */
export function deactivate(): void {
  console.log('novel-helper 已停用！');
  // 确保停用时清理功能模块
  try { disposeAllFeatures(); } catch { /* ignore */ }
  // 尽量把防抖中的配置写入落盘
  void flushConfigWrites();
}