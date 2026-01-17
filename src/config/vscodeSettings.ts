import * as vscode from 'vscode';
import { defaultConfig, type NovelHelperConfig } from './types';
import { CONFIG_FILE_NAME, ensureConfigLoaded, readConfig, writeConfig } from './fileStore';

/**
 * 统一更新配置：同时写入 .novel-helper.json 与工作区 settings.json（novel-helper.*）。
 */
export function updateNovelHelperSetting<K extends keyof NovelHelperConfig>(
  key: K,
  value: NovelHelperConfig[K],
  target?: vscode.ConfigurationTarget
): Promise<void>;
export function updateNovelHelperSetting(
  key: keyof NovelHelperConfig,
  value: NovelHelperConfig[keyof NovelHelperConfig],
  target?: vscode.ConfigurationTarget
): Promise<void>;
export async function updateNovelHelperSetting(
  key: keyof NovelHelperConfig,
  value: NovelHelperConfig[keyof NovelHelperConfig],
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
): Promise<void> {
  await ensureConfigLoaded();
  writeConfig({ [key]: value } as Partial<NovelHelperConfig>);
  await vscode.workspace.getConfiguration('novel-helper').update(key as string, value, target);
}

/** 获取 VS Code 配置覆盖后的最终配置（novel-helper.* 优先）。 */
export const getVSCodeConfig = (): NovelHelperConfig => {
  const config = vscode.workspace.getConfiguration('novel-helper');
  return {
    ...readConfig(),
    paragraphIndent: config.get('paragraphIndent', 2),
    overallIndent: config.get('overallIndent', 0),
    lineSpacing: config.get('lineSpacing', 1),
    paragraphSplitMode: config.get('paragraphSplitMode', 'anyBlankLine'),
    paragraphSplitOnIndentedLine: config.get('paragraphSplitOnIndentedLine', true),
    fontSize: config.get('fontSize', 14),
    editorLineHeight: config.get('editorLineHeight', 0),
    highlightColor: config.get('highlightColor', '#FFD700'),
    autoDisableIndentGuides: config.get('autoDisableIndentGuides', false),
    autoLayoutOnEnter: config.get('autoLayoutOnEnter', false),
    editorWordWrapColumn: config.get('editorWordWrapColumn', 0),
    useFullWidthIndent: config.get('useFullWidthIndent', false)
  };
};

/** 在工作区设置中隐藏配置文件 */
export const hideConfigFileInExplorer = (): void => {
  try {
    const workspaceConfig = vscode.workspace.getConfiguration('files');
    const exclude = workspaceConfig.get<Record<string, boolean>>('exclude') || {};
    let changed = false;

    if (!exclude[CONFIG_FILE_NAME]) {
      exclude[CONFIG_FILE_NAME] = true;
      changed = true;
    }
    if (!exclude['.vscode']) {
      exclude['.vscode'] = true;
      changed = true;
    }
    if (!exclude['.vscode/**']) {
      exclude['.vscode/**'] = true;
      changed = true;
    }
    if (changed) {
      workspaceConfig.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // ignore
  }
};

/** 清除工作区 settings 中的 novel-helper.* 配置 */
export const clearNovelHelperWorkspaceSettings = async (
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
): Promise<void> => {
  const config = vscode.workspace.getConfiguration('novel-helper');
  const keys = Object.keys(defaultConfig) as (keyof NovelHelperConfig)[];

  for (const key of keys) {
    try {
      await config.update(key as string, undefined, target);
    } catch {
      // ignore per-key failure
    }
  }
};
