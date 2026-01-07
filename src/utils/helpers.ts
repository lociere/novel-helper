import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 统计文本字数（优化版：适配中文小说计数规则）
 * 规则：中文字符算1个，英文单词算1个，数字算1个
 * @param text 待统计的文本
 * @returns 精准计数字数
 */
export const countWords = (text: string): number => {
  // 增加类型校验：非字符串直接返回0
  if (!text || typeof text !== 'string') {
    return 0;
  }

  let totalCount = 0;

  // 1. 匹配中文字符（[\u4e00-\u9fa5] 覆盖常用中文）
  const chineseCharMatches = text.match(/[\u4e00-\u9fa5]/g);
  if (chineseCharMatches) {
    totalCount += chineseCharMatches.length;
  }

  // 2. 匹配英文单词（至少1个字母，后跟可选字母/数字/下划线）
  const englishWordMatches = text.match(/[a-zA-Z]+[a-zA-Z0-9_]*/g);
  if (englishWordMatches) {
    totalCount += englishWordMatches.length;
  }

  // 3. 匹配独立数字（按完整数字串算1个，如"123"算1个）
  const numberMatches = text.match(/\b\d+\b/g);
  if (numberMatches) {
    totalCount += numberMatches.length;
  }

  return totalCount;
};

/**
 * 获取工作区根路径
 * @returns 根路径字符串 | undefined
 */
export const getWorkspaceRoot = (): string | undefined => {
  return vscode.workspace.rootPath;
};

/**
 * 读取目录下的文件列表（优化：增加错误捕获）
 * @param dirPath 目录路径
 * @returns 文件名称数组
 */
export const getDirFiles = (dirPath: string): string[] => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return [];
  }
  
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error('[Novel Helper] 读取目录失败:', error);
    vscode.window.showErrorMessage(`读取目录失败：${(error as Error).message}`);
    return [];
  }
};