import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 创建目录（优化版：增加错误处理+返回执行结果）
 * @param dirPath 目录路径
 * @returns 创建是否成功
 */
export const createDir = (dirPath: string): boolean => {
  // 参数有效性检查
  if (!dirPath || typeof dirPath !== 'string') {
    vscode.window.showErrorMessage('目录路径不能为空且必须为字符串！');
    return false;
  }

  try {
    // 检查目录是否已存在
    if (!fs.existsSync(dirPath)) {
      // 递归创建目录
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    // 捕获并显示错误信息
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
export const createFile = (filePath: string, content = ''): boolean => {
  // 参数有效性检查
  if (!filePath || typeof filePath !== 'string') {
    vscode.window.showErrorMessage('文件路径不能为空且必须为字符串！');
    return false;
  }

  try {
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      const fileName = path.basename(filePath);
      vscode.window.showWarningMessage(`文件已存在：${fileName}`);
      return false;
    }

    // 确保父目录存在
    const parentDir = path.dirname(filePath);
    createDir(parentDir);

    // 写入文件内容
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    const errMsg = (error as Error).message;
    vscode.window.showErrorMessage(`创建文件失败：${errMsg}`);
    console.error('[Novel Helper] 创建文件错误:', error);
    return false;
  }
};

/**
 * 读取文件内容（优化版：增加错误处理）
 * @param filePath 文件路径
 * @returns 文件内容（读取失败返回空字符串）
 */
export const readFile = (filePath: string): string => {
  if (!filePath || !fs.existsSync(filePath)) {
    return '';
  }

  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    const errMsg = (error as Error).message;
    vscode.window.showErrorMessage(`读取文件失败：${errMsg}`);
    console.error('[Novel Helper] 读取文件错误:', error);
    return '';
  }
};

/**
 * 写入文件内容（优化版：增加错误处理+友好提示）
 * @param filePath 文件路径
 * @param content 要写入的内容
 */
export const writeFile = (filePath: string, content: string): void => {
  if (!filePath || typeof filePath !== 'string') {
    vscode.window.showErrorMessage('文件路径不能为空且必须为字符串！');
    return;
  }

  try {
    // 确保父目录存在
    const parentDir = path.dirname(filePath);
    createDir(parentDir);

    // 写入文件
    fs.writeFileSync(filePath, content, 'utf-8');
    
    // 友好提示
    const fileName = path.basename(filePath);
    vscode.window.showInformationMessage(`文件保存成功：${fileName}`);
  } catch (error) {
    const errMsg = (error as Error).message;
    vscode.window.showErrorMessage(`文件保存失败：${errMsg}`);
    console.error('[Novel Helper] 写入文件错误:', error);
  }
};