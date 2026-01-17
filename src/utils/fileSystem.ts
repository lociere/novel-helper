import * as path from 'path';
import * as vscode from 'vscode';
import { ensureDir, writeTextFileIfMissing } from './workspaceFs';

/**
 * 兼容层：建议直接使用 VS Code 的 workspace.fs 或 src/utils/workspaceFs.ts。
 * 这里保留 createDir/createFile 名称，避免未来重构时出现重复实现。
 */
export const createDir = async (dirPath: string): Promise<boolean> => {
  if (!dirPath || typeof dirPath !== 'string') {
    vscode.window.showErrorMessage('目录路径不能为空且必须为字符串！');
    return false;
  }
  try {
    await ensureDir(vscode.Uri.file(dirPath));
    return true;
  } catch (error) {
    const errMsg = (error as Error).message;
    vscode.window.showErrorMessage(`创建目录失败：${errMsg}`);
    console.error('[Novel Helper] 创建目录错误:', error);
    return false;
  }
};

/**
 * 创建文件（优化版：错误处理+父目录检查+返回执行结果）
 * @param filePath 文件路径
 * @param content 文件内容
 * @returns 创建是否成功
 */
export const createFile = async (filePath: string, content = ''): Promise<boolean> => {
  if (!filePath || typeof filePath !== 'string') {
    vscode.window.showErrorMessage('文件路径不能为空且必须为字符串！');
    return false;
  }
  try {
    await ensureDir(vscode.Uri.file(path.dirname(filePath)));
    await writeTextFileIfMissing(vscode.Uri.file(filePath), content);
    return true;
  } catch (error) {
    const errMsg = (error as Error).message;
    vscode.window.showErrorMessage(`创建文件失败：${errMsg}`);
    console.error('[Novel Helper] 创建文件错误:', error);
    return false;
  }
};

// 说明：目录枚举建议使用 VS Code 内置的 vscode.workspace.fs.readDirectory。