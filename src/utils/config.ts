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
  /**
   * 文本整体缩进空格数：对所有行生效（首行/折行/所有段落）。
   * 默认 0。
   */
  overallIndent: number;
  lineSpacing: number;
  fontSize: number;
  highlightColor: string;
  /**
   * 自动隐藏 VS Code 缩进参考线（避免出现竖线）。
   * 仅写入工作区设置，不影响全局用户设置。
   */
  autoDisableIndentGuides: boolean;
  /**
   * 是否在“格式化文档”时进行硬换行（插入真实换行符）。
   * 默认关闭，避免改变既有行为。
   */
  hardWrapOnFormat: boolean;
  /**
   * 自动硬换行阈值（字符数）。
   * 0 表示关闭。
   */
  autoHardWrapColumn: number;
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
  overallIndent: 0,
  lineSpacing: 1,
  fontSize: 14,
  highlightColor: '#FFD700',
  autoDisableIndentGuides: false,
  hardWrapOnFormat: false,
  autoHardWrapColumn: 0,
  highlightItems: {},
  editStartTime: 0,
  totalEditTime: 0,
  lastWordCount: 0
};

/**
 * 兼容旧配置：将 highlightTextColor 迁移到 highlightColor，并移除冗余字段
 */
const sanitizeConfig = (raw: unknown): { config: NovelHelperConfig; changed: boolean } => {
  let changed = false;
  const rawObj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : undefined;
  const cfg: NovelHelperConfig = { ...defaultConfig, ...((rawObj || {}) as Partial<NovelHelperConfig>) };

  if (rawObj) {
    // 如果旧配置存在 highlightTextColor，而 highlightColor 未自定义，则迁移值
    const oldHighlightTextColor = rawObj['highlightTextColor'];
    const newHighlightColor = rawObj['highlightColor'];
    if (typeof oldHighlightTextColor === 'string') {
      if (typeof newHighlightColor !== 'string' || newHighlightColor === defaultConfig.highlightColor) {
        cfg.highlightColor = oldHighlightTextColor;
      }
      changed = true;
    }
  }

  if ('highlightTextColor' in (cfg as any)) {
    delete (cfg as any).highlightTextColor;
    changed = true;
  }

  return { config: cfg, changed };
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
    overallIndent: config.get('overallIndent', 0),
    lineSpacing: config.get('lineSpacing', 1),
    fontSize: config.get('fontSize', 14),
    highlightColor: config.get('highlightColor', '#FFD700'),
    autoDisableIndentGuides: config.get('autoDisableIndentGuides', false),
    hardWrapOnFormat: config.get('hardWrapOnFormat', false),
    autoHardWrapColumn: config.get('autoHardWrapColumn', 0)
  };
};

/**
 * 在工作区设置中隐藏配置文件
 */
export const hideConfigFileInExplorer = (): void => {
  try {
    const workspaceConfig = vscode.workspace.getConfiguration('files');
    const exclude = workspaceConfig.get<Record<string, boolean>>('exclude') || {};
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