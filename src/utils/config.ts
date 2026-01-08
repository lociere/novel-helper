import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** 插件配置类型 */
export interface NovelHelperConfig {
  workspacePath: string;
  paragraphIndent: number;
  lineSpacing: number;
  highlightColor: string;
  highlightTextColor: string;
  /**
   * highlightItems 的值采用可序列化的范围表示，便于写入配置文件
   * range: { start: { line, character }, end: { line, character } }
   */
  highlightItems: { [key: string]: { path: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } } };
  editStartTime: number;
  totalEditTime: number;
  lastWordCount: number;
}

/** 默认配置 */
const defaultConfig: NovelHelperConfig = {
  workspacePath: '',
  paragraphIndent: 2,
  lineSpacing: 1,
  highlightColor: '#FFD700',
  highlightTextColor: '#000000',
  highlightItems: {},
  editStartTime: 0,
  totalEditTime: 0,
  lastWordCount: 0
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
    return { ...defaultConfig, ...JSON.parse(content) };
  } catch (e) {
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
  const newConfig = { ...currentConfig, ...config };
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  } catch (e) {
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
    highlightColor: config.get('highlightColor', '#FFD700'),
    highlightTextColor: config.get('highlightTextColor', '#000000')
  };
};

/**
 * 在工作区设置中隐藏配置文件
 */
export const hideConfigFileInExplorer = (): void => {
  try {
    const workspaceConfig = vscode.workspace.getConfiguration('files');
    const exclude = workspaceConfig.get<any>('exclude') || {};
    if (!exclude[CONFIG_FILE_NAME]) {
      exclude[CONFIG_FILE_NAME] = true;
      workspaceConfig.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
    }
  } catch (e) {
    // 忽略配置更新失败
  }
};