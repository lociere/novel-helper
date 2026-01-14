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
  /**
   * 段间距（段间空行数）。
   */
  lineSpacing: number;
  /**
   * 段内行间距（段内空行数）。
   * 仅影响同一段内多行（例如硬换行产生的多行）。
   */
  intraLineSpacing: number;
  /**
   * 段落识别策略：决定是否把“空行”作为段落分隔标准。
   * - anyBlankLine: 只要文档中出现过空行，就用空行分段（旧逻辑）
   * - requireAll: 只有当所有段落边界都有空行时才用空行分段，否则退化为“一行一段”
   * - majority: 当大多数段落边界都有空行时才用空行分段，否则退化为“一行一段”
   */
  paragraphSplitMode: 'anyBlankLine' | 'requireAll' | 'majority';
  /**
   * 当某一行本身带段首缩进（看起来是新段开头）时，即使段落间没有空行，也强制从该行开始新段落。
   */
  paragraphSplitOnIndentedLine: boolean;
  /**
   * 将同一段内“只是为了换行而手动断行”的多行文字合并为一行，再按阈值重新硬换行。
   * 仅在 hardWrapOnFormat 开启时生效。
   */
  mergeSoftWrappedLines: boolean;
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
   * 是否自动同步 VS Code 的显示换行设置（editor.wordWrap / editor.wordWrapColumn）。
   * 仅写入工作区设置，不影响全局用户设置。
   */
  autoSyncWordWrapColumn: boolean;
  /**
   * VS Code 显示换行列宽（editor.wordWrapColumn）。
   * 0 表示跟随 autoHardWrapColumn（当启用 autoSyncWordWrapColumn 时）。
   */
  editorWordWrapColumn: number;
  /**
   * 是否使用全角空格（U+3000）作为缩进单位。
   * 适合中文小说排版：视觉上更明显。
   */
  useFullWidthIndent: boolean;
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
  intraLineSpacing: 0,
  paragraphSplitMode: 'anyBlankLine',
  paragraphSplitOnIndentedLine: true,
  mergeSoftWrappedLines: true,
  fontSize: 14,
  highlightColor: '#FFD700',
  autoDisableIndentGuides: false,
  hardWrapOnFormat: false,
  autoHardWrapColumn: 0,
  autoSyncWordWrapColumn: false,
  editorWordWrapColumn: 0,
  useFullWidthIndent: false,
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
  writeConfig({ [key]: value } as Partial<NovelHelperConfig>);
  await vscode.workspace.getConfiguration('novel-helper').update(key as string, value, target);
}

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
    // 默认：段内行间距 = max(段间距-1, 0)，但允许用户单独配置覆盖
    intraLineSpacing: config.get('intraLineSpacing', Math.max(0, config.get('lineSpacing', 1) - 1)),
    paragraphSplitMode: config.get('paragraphSplitMode', 'anyBlankLine'),
    paragraphSplitOnIndentedLine: config.get('paragraphSplitOnIndentedLine', true),
    mergeSoftWrappedLines: config.get('mergeSoftWrappedLines', true),
    fontSize: config.get('fontSize', 14),
    highlightColor: config.get('highlightColor', '#FFD700'),
    autoDisableIndentGuides: config.get('autoDisableIndentGuides', false),
    hardWrapOnFormat: config.get('hardWrapOnFormat', false),
    autoHardWrapColumn: config.get('autoHardWrapColumn', 0),
    autoSyncWordWrapColumn: config.get('autoSyncWordWrapColumn', false),
    editorWordWrapColumn: config.get('editorWordWrapColumn', 0),
    useFullWidthIndent: config.get('useFullWidthIndent', false)
  };
};

/**
 * 读取 VS Code 的编辑器换行/制表设置，用于与自动换行逻辑对齐。
 */
export const getEditorWrapSettings = (doc?: vscode.TextDocument): {
  wordWrap: string;
  wordWrapColumn: number;
  tabSize: number;
} => {
  const editorConfig = vscode.workspace.getConfiguration('editor', doc?.uri);
  const wordWrap = editorConfig.get<string>('wordWrap', 'off');
  const wordWrapColumn = editorConfig.get<number>('wordWrapColumn', 80);
  let tabSize = editorConfig.get<number | string>('tabSize', 4);

  // 若有活动编辑器且对应文档，优先使用当前解析后的数值 tabSize
  const ed = vscode.window.activeTextEditor;
  if (ed && (!doc || ed.document === doc)) {
    const ts = ed.options.tabSize;
    if (typeof ts === 'number' && Number.isFinite(ts) && ts > 0) {
      tabSize = ts;
    }
  }

  // 配置可能为 'auto'，此时兜底 4
  const numericTabSize = typeof tabSize === 'number' ? tabSize : 4;
  return { wordWrap, wordWrapColumn: Math.max(1, Number(wordWrapColumn || 80)), tabSize: Math.max(1, Number(numericTabSize || 4)) };
};

export type EffectiveWrapSettings = {
  /** 0 表示禁用阀值（不进行自动硬换行/不按阀值折行） */
  column: number;
  tabSize: number;
  source: 'vscode' | 'novel-helper' | 'disabled';
  editor: ReturnType<typeof getEditorWrapSettings>;
};

/**
 * 计算“实际生效”的换行阀值与 tabSize。
 * 规则：
 * - 开启 autoSyncWordWrapColumn：优先使用 novel-helper.editorWordWrapColumn（>0）否则使用 VS Code editor.wordWrapColumn
 * - 未开启同步：优先使用 novel-helper.autoHardWrapColumn（>0），否则使用 novel-helper.editorWordWrapColumn（>0），否则 0
 */
export const getEffectiveWrapSettings = (
  cfg: NovelHelperConfig,
  doc?: vscode.TextDocument
): EffectiveWrapSettings => {
  const editor = getEditorWrapSettings(doc);

  if (cfg.autoSyncWordWrapColumn) {
    const column = cfg.editorWordWrapColumn && cfg.editorWordWrapColumn > 0
      ? cfg.editorWordWrapColumn
      : editor.wordWrapColumn;
    return { column, tabSize: editor.tabSize, source: 'vscode', editor };
  }

  if (cfg.autoHardWrapColumn && cfg.autoHardWrapColumn > 0) {
    return { column: cfg.autoHardWrapColumn, tabSize: editor.tabSize, source: 'novel-helper', editor };
  }

  if (cfg.editorWordWrapColumn && cfg.editorWordWrapColumn > 0) {
    return { column: cfg.editorWordWrapColumn, tabSize: editor.tabSize, source: 'novel-helper', editor };
  }

  return { column: 0, tabSize: editor.tabSize, source: 'disabled', editor };
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

/** 删除工作区配置文件（.novel-helper.json），若不存在则跳过 */
export const deleteConfigFile = (): void => {
  const configPath = getConfigFilePath();
  if (!configPath) { return; }
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  } catch {
    vscode.window.showErrorMessage('删除配置文件失败');
  }
};

/** 清除工作区 settings 中的 novel-helper.* 配置 */
export const clearNovelHelperWorkspaceSettings = async (target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> => {
  const config = vscode.workspace.getConfiguration('novel-helper');
  const keys = Object.keys(defaultConfig) as (keyof NovelHelperConfig)[];

  for (const key of keys) {
    try {
      await config.update(key as string, undefined, target);
    } catch {
      // ignore per-key failure to continue clearing others
    }
  }
};

/** 判断当前工作区是否已通过 Novel Helper 初始化（存在配置文件） */
export const isWorkspaceInitialized = (): boolean => {
  const configPath = getConfigFilePath();
  if (!configPath || !fs.existsSync(configPath)) { return false; }

  const currentRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!currentRoot) { return false; }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<NovelHelperConfig>;
    return typeof parsed.workspacePath === 'string' && parsed.workspacePath === currentRoot;
  } catch {
    return false;
  }
};