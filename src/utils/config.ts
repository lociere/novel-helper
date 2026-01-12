import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface HighlightItem {
  path: string;
  range: Range;
}

/** 插件配置类型 */
export interface NovelHelperConfig {
  workspacePath: string;
  paragraphIndent: number;
  lineSpacing: number;
  fontSize: number;
  highlightColor: string;
  /**
   * highlightItems 的值采用可序列化的范围表示，便于写入配置文件
   */
  highlightItems: { [key: string]: HighlightItem };
  editStartTime: number;
  totalEditTime: number;
  lastWordCount: number;
}

/** 默认配置 */
const defaultConfig: NovelHelperConfig = {
  workspacePath: '',
  paragraphIndent: 2,
  lineSpacing: 1,
  fontSize: 14,
  highlightColor: '#FFD700',
  highlightItems: {},
  editStartTime: 0,
  totalEditTime: 0,
  lastWordCount: 0
};

/**
 * 兼容旧配置：将 highlightTextColor 迁移到 highlightColor，并移除冗余字段
 */
const sanitizeConfig = (raw: any): { config: NovelHelperConfig; changed: boolean } => {
  let changed = false;
  const cfg: any = { ...defaultConfig, ...(raw || {}) };

  if (raw && typeof raw === 'object') {
    // 如果旧配置存在 highlightTextColor，而 highlightColor 未自定义，则迁移值
    if ((raw as any).highlightTextColor) {
      if (!(raw as any).highlightColor || (raw as any).highlightColor === defaultConfig.highlightColor) {
        cfg.highlightColor = (raw as any).highlightTextColor;
      }
      changed = true;
    }
  }

  if ('highlightTextColor' in cfg) {
    delete cfg.highlightTextColor;
    changed = true;
  }

  return { config: cfg as NovelHelperConfig, changed };
};

/** 配置文件名称 */
export const CONFIG_FILE_NAME = '.novel-helper.json';

/**
 * 获取工作区配置文件路径
 * @returns 配置文件路径
 */
export const getConfigFilePath = (): string => {
  if (!vscode.workspace.workspaceFolders) {
    return '';
  }
  return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, CONFIG_FILE_NAME);
};

/**
 * 读取配置
 * @returns 配置对象
 */
export const readConfig = (): NovelHelperConfig => {
  const configPath = getConfigFilePath();
  if (!fs.existsSync(configPath)) {
    return { ...defaultConfig, workspacePath: vscode.workspace.workspaceFolders?.[0].uri.fsPath || '' };
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    const { config: sanitized, changed } = sanitizeConfig(parsed);
    if (changed) {
      fs.writeFileSync(configPath, JSON.stringify(sanitized, null, 2), 'utf-8');
    }
    return sanitized;
  } catch {
    vscode.window.showErrorMessage('读取配置文件失败，使用默认配置');
    return defaultConfig;
  }
};

/**
 * 写入配置
 * @param config 配置对象
 */
export const writeConfig = (config: Partial<NovelHelperConfig>): void => {
  const configPath = getConfigFilePath();
  if (!configPath) {
    vscode.window.showErrorMessage('未找到工作区');
    return;
  }
  const currentConfig = readConfig();
  const { config: newConfig } = sanitizeConfig({ ...currentConfig, ...config });
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  } catch {
    vscode.window.showErrorMessage('写入配置文件失败');
  }
};

/**
 * 获取VSCode内置配置
 * @returns 内置配置
 */
export const getVSCodeConfig = (): NovelHelperConfig => {
  const config = vscode.workspace.getConfiguration('novel-helper');
  return {
    ...readConfig(),
    paragraphIndent: config.get('paragraphIndent', 2),
    lineSpacing: config.get('lineSpacing', 1),
    fontSize: config.get('fontSize', 14),
    highlightColor: config.get('highlightColor', '#FFD700')
  };
};

/**
 * 在工作区设置中隐藏配置文件
 */
export const hideConfigFileInExplorer = (): void => {
  try {
    const workspaceConfig = vscode.workspace.getConfiguration('files');
    const exclude = workspaceConfig.get<any>('exclude') || {};
    let changed = false;
    if (!exclude[CONFIG_FILE_NAME]) {
      exclude[CONFIG_FILE_NAME] = true;
      changed = true;
    }
    // 隐藏 .vscode 文件夹（工作区设置）
    if (!exclude['.vscode']) {
      exclude['.vscode'] = true;
      changed = true;
    }
    // 额外添加通配，确保隐藏子项
    if (!exclude['.vscode/**']) {
      exclude['.vscode/**'] = true;
      changed = true;
    }
    if (changed) {
      workspaceConfig.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
    }
  } catch {
    // 忽略配置更新失败
  }
};