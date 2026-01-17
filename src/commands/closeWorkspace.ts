import * as vscode from 'vscode';
import { clearNovelHelperWorkspaceSettings, deleteConfigFile } from '../utils/config';
import { disposeAllFeatures } from '../utils/featureRegistry';

/**
 * 关闭 Novel Helper 工作区：清空已记录的 workspacePath。
 * 不删除用户文件，只移除插件自身的工作区绑定。
 */
export const closeWorkspace = async (): Promise<void> => {
  try {
    // 1) 删除配置文件以阻断下次激活（并防止防抖写入回写）
    await deleteConfigFile();

    // 2) 移除工作区 settings 中的 novel-helper.*，避免下次打开时插件再次生效
    await clearNovelHelperWorkspaceSettings(vscode.ConfigurationTarget.Workspace);

    // 3) 立即卸载当前已注册的功能模块（状态栏/树视图/高亮/格式化等）
    disposeAllFeatures();

    void vscode.commands.executeCommand('setContext', 'novelHelper.initialized', false);

    vscode.window.showInformationMessage('Novel Helper：已关闭工作区，保留了你的本地文件（大纲/设定等）。下次打开该文件夹将不会自动启用插件。');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Novel Helper：关闭工作区失败，原因：${msg}`);
  }
};
