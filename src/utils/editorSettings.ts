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
