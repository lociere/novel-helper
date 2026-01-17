import * as vscode from 'vscode';
import { getVSCodeConfig } from '../config';

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
 * - 始终写入工作区 editor.wordWrap=wordWrapColumn
 * - editorWordWrapColumn>0 时写入 editor.wordWrapColumn；否则移除工作区层面的 wordWrapColumn（回退到用户/默认值）
 */
export const syncWordWrapSetting = async (): Promise<void> => {
  const cfg = getVSCodeConfig();
  const editorCfg = vscode.workspace.getConfiguration('editor');

  try {
    // 小说排版：始终依赖 VS Code 软换行（wordWrapColumn）。
    await editorCfg.update('wordWrap', 'wordWrapColumn', vscode.ConfigurationTarget.Workspace);
    if (cfg.editorWordWrapColumn > 0) {
      await editorCfg.update('wordWrapColumn', cfg.editorWordWrapColumn, vscode.ConfigurationTarget.Workspace);
    } else {
      await editorCfg.update('wordWrapColumn', undefined, vscode.ConfigurationTarget.Workspace);
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

/**
 * 根据插件配置同步 VS Code 行高（editor.lineHeight）。
 */
export const syncEditorLineHeightSetting = async (): Promise<void> => {
  const cfg = getVSCodeConfig();
  const editorCfg = vscode.workspace.getConfiguration('editor');

  try {
    if (cfg.editorLineHeight && cfg.editorLineHeight > 0) {
      await editorCfg.update('lineHeight', cfg.editorLineHeight, vscode.ConfigurationTarget.Workspace);
    } else {
      await editorCfg.update('lineHeight', undefined, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // ignore
  }
};

/**
 * 根据插件配置同步 VS Code 自动保存（files.autoSave）。
 * - 开启：files.autoSave=afterDelay，并写入一个合理的延迟（默认 1000ms）
 * - 关闭：files.autoSave=off，并移除工作区层面的 autoSaveDelay
 */
export const syncAutoSaveSetting = async (): Promise<void> => {
  const cfg = getVSCodeConfig();
  const filesCfg = vscode.workspace.getConfiguration('files');

  try {
    if (cfg.autoSaveEnabled) {
      await filesCfg.update('autoSave', 'afterDelay', vscode.ConfigurationTarget.Workspace);
      // VS Code 默认是 1000ms；支持通过插件配置调整
      const delay = Number(cfg.autoSaveDelayMs);
      const normalizedDelay = Number.isFinite(delay) && delay > 0 ? Math.floor(delay) : 1000;
      await filesCfg.update('autoSaveDelay', normalizedDelay, vscode.ConfigurationTarget.Workspace);
    } else {
      await filesCfg.update('autoSave', 'off', vscode.ConfigurationTarget.Workspace);
      await filesCfg.update('autoSaveDelay', undefined, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // ignore
  }
};

/**
 * 同步 Novel Helper 相关的 VS Code 编辑器设置（工作区级别）。
 *
 * 职责边界：
 * - 本函数仅写入工作区 settings，不修改用户全局设置。
 * - 具体每项设置的逻辑由各自的 sync* 函数维护。
 */
export const syncAllEditorSettings = async (): Promise<void> => {
  // 顺序无强依赖；这里串行执行以降低并发写入导致的偶发失败。
  await syncIndentGuidesSetting();
  await syncWordWrapSetting();
  await syncWrappingIndentSetting();
  await syncEditorLineHeightSetting();
  await syncAutoSaveSetting();
};
