/**
 * 兼容层（保留旧 API 名称）：建议直接使用 src/utils/workspaceFs.ts。
 * 这里不再实现逻辑，仅做薄封装，避免重复代码。
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { ensureDir, writeTextFileIfMissing } from './workspaceFs';

export const createDir = async (dirPath: string): Promise<boolean> => {
  if (!dirPath || typeof dirPath !== 'string') { return false; }
  try {
    await ensureDir(vscode.Uri.file(dirPath));
    return true;
  } catch {
    return false;
  }
};

export const createFile = async (filePath: string, content = ''): Promise<boolean> => {
  if (!filePath || typeof filePath !== 'string') { return false; }
  try {
    await ensureDir(vscode.Uri.file(path.dirname(filePath)));
    await writeTextFileIfMissing(vscode.Uri.file(filePath), content);
    return true;
  } catch {
    return false;
  }
};