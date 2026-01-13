import * as vscode from 'vscode';
import { getVSCodeConfig } from './config';

/**
 * 根据插件配置同步 VS Code 编辑器缩进参考线设置。
 * - 开启：写入工作区设置，隐藏缩进参考线与活动缩进参考线
 * - 关闭：移除工作区层面的对应设置，回退到用户/默认值
 */
export const syncIndentGuidesSetting = async (): Promise<void> => {
  const cfg = getVSCodeConfig();
  const editorCfg = vscode.workspace.getConfiguration('editor');

  try {
    if (cfg.autoDisableIndentGuides) {
      await editorCfg.update('guides.indentation', false, vscode.ConfigurationTarget.Workspace);
      await editorCfg.update('guides.highlightActiveIndentation', false, vscode.ConfigurationTarget.Workspace);
    } else {
      await editorCfg.update('guides.indentation', undefined, vscode.ConfigurationTarget.Workspace);
      await editorCfg.update('guides.highlightActiveIndentation', undefined, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // 忽略写入失败（例如无工作区或权限问题）
  }
};

/**
 * 根据插件配置同步 VS Code 的自动换行显示：
 * - 开启：写入工作区 editor.wordWrap=wordWrapColumn，并设置 editor.wordWrapColumn
 * - 关闭：移除工作区层面的对应设置，回退到用户/默认值
 */
export const syncWordWrapSetting = async (): Promise<void> => {
  const cfg = getVSCodeConfig();
  const editorCfg = vscode.workspace.getConfiguration('editor');

  const desiredColumn = cfg.editorWordWrapColumn > 0
    ? cfg.editorWordWrapColumn
    : cfg.autoHardWrapColumn;

  try {
    if (cfg.autoSyncWordWrapColumn && desiredColumn > 0) {
      await editorCfg.update('wordWrap', 'wordWrapColumn', vscode.ConfigurationTarget.Workspace);
      await editorCfg.update('wordWrapColumn', desiredColumn, vscode.ConfigurationTarget.Workspace);
    } else {
      await editorCfg.update('wordWrap', undefined, vscode.ConfigurationTarget.Workspace);
      await editorCfg.update('wordWrapColumn', undefined, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // 忽略写入失败（例如无工作区或权限问题）
  }
};
