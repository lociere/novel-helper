import * as vscode from 'vscode';
import { readConfig } from './config';

/** 获取工作区根路径：优先使用配置中的 workspacePath，否则回退到第一个 workspace folder。 */
export const getWorkspaceRoot = (): string | undefined => {
  // 优先使用 config 中保存的 workspacePath（初始化后会写入），否则回退到当前打开的第一个工作区
  try {
    const cfg = readConfig();
    if (cfg && cfg.workspacePath) {
      return cfg.workspacePath;
    }
  } catch {
    // 忽略读取配置失败，回退到 workspaceFolders
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
};
