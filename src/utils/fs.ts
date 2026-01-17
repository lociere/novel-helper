import * as vscode from 'vscode';
import { readConfig } from '../config';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

/**
 * 获取工作区根路径
 * 优先使用配置中的 workspacePath，否则回退到第一个 workspace folder。
 */
export const getWorkspaceRoot = (): string | undefined => {
  try {
    const cfg = readConfig();
    if (cfg && cfg.workspacePath) {
      return cfg.workspacePath;
    }
  } catch {
    // ignore
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
};

export const pathExists = async (uri: vscode.Uri): Promise<boolean> => {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
};

export const ensureDir = async (uri: vscode.Uri): Promise<void> => {
  try {
    await vscode.workspace.fs.createDirectory(uri);
  } catch {
    // ignore
  }
};

export const readTextFile = async (uri: vscode.Uri): Promise<string> => {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return decoder.decode(bytes);
};

export const writeTextFile = async (uri: vscode.Uri, content: string): Promise<void> => {
  await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
};

export const writeTextFileIfMissing = async (uri: vscode.Uri, content: string): Promise<boolean> => {
  const exists = await pathExists(uri);
  if (exists) { return false; }
  await writeTextFile(uri, content);
  return true;
};
