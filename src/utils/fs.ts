import * as vscode from 'vscode';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

/**
 * 获取工作区根路径
 * 直接使用第一个 workspace folder。
 *
 * 说明：这里不要依赖 config/fileStore（避免形成 utils -> config -> utils 的循环依赖）。
 */
export const getWorkspaceRoot = (): string | undefined => {
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
