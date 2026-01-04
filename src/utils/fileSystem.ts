import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 创建目录（递归）
 * @param dirPath 目录路径
 */
export const createDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 创建文件
 * @param filePath 文件路径
 * @param content 文件内容
 */
export const createFile = (filePath: string, content = ''): void => {
  if (fs.existsSync(filePath)) {
    vscode.window.showWarningMessage(`文件已存在：${filePath}`);
    return;
  }
  try {
    createDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf-8');
    vscode.window.showInformationMessage(`创建文件成功：${path.basename(filePath)}`);
  } catch (error) { 
    vscode.window.showErrorMessage(`创建文件失败：${error}`);
  }
};

/**
 * 获取工作区根路径
 * @returns 根路径
 */
export const getWorkspaceRoot = (): string | undefined => {
  return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
};

/**
 * 检查是否是小说工作区
 * @returns 是否是小说工作区
 */
export const isNovelWorkspace = (): boolean => {
  const root = getWorkspaceRoot();
  if (!root) {
    return false;
  }
  return fs.existsSync(path.join(root, '.novel-helper.json'));
};

/**
 * 获取目录下的文件列表（排除配置文件）
 * @param dirPath 目录路径
 * @returns 文件列表
 */
export const getDirFiles = (dirPath: string): string[] => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath).filter(file => {
    return file !== '.novel-helper.json' && !file.startsWith('.');
  });
};