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

  try {
    // 小说排版：始终依赖 VS Code 软换行（wordWrapColumn）。
    await editorCfg.update('wordWrap', 'wordWrapColumn', vscode.ConfigurationTarget.Workspace);
    if (cfg.editorWordWrapColumn > 0) {
      await editorCfg.update('wordWrapColumn', cfg.editorWordWrapColumn, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // 忽略写入失败（例如无工作区或权限问题）
  }
};

/**
 * 小说工作区启动后：强制关闭 wrappingIndent，便于对每段添加段首缩进。
 */
export const syncWrappingIndentSetting = async (): Promise<void> => {
  const editorCfg = vscode.workspace.getConfiguration('editor');
  try {
    await editorCfg.update('wrappingIndent', 'none', vscode.ConfigurationTarget.Workspace);
  } catch {
    // ignore
  }
};
