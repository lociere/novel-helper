import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { readConfig } from './config';

/**
 * 统计文本字数（优化版：适配中文小说计数规则）
 * 规则：中文字符算1个，英文单词算1个，数字算1个
 * @param text 待统计的文本
 * @returns 精准计数字数
 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  let totalCount = 0;

  // 1. 匹配中文字符及中文标点 (扩展范围)
  // \u4e00-\u9fa5: 基本汉字
  // \u3000-\u303f: CJK 标点
  // \uff00-\uffef: 全角ASCII、全角标点
  // \u2000-\u206f: 常用标点 (如及 em dash)
  const chineseAndPunctuation = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f]/g);
  if (chineseAndPunctuation) {
    totalCount += chineseAndPunctuation.length;
  }

  // 2. 移除已被上述正则匹配掉的字符，避免重复计算
  // 这里采用简化的互斥逻辑：英文单词和数字通过 \w 匹配，但在中文环境下需要小心
  // 将中文及中文标点替换为空，再统计剩下的单词/数字
  const remainingText = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f]/g, ' ');

  // 3. 匹配英文单词和数字 (连续的字母数字下划线算作 1 个词)
  const wordMatches = remainingText.match(/[a-zA-Z0-9_\-]+/g);
  if (wordMatches) {
    totalCount += wordMatches.length;
  }

  return totalCount;
};

/**
 * 获取工作区根路径（兼容多工作区）
 * @returns 根路径字符串 | undefined
 */
export const getWorkspaceRoot = (): string | undefined => {
  // 优先使用 config 中保存的 workspacePath（初始化后会写入），否则回退到当前打开的第一个工作区
  try {
    const cfg = readConfig();
    if (cfg && cfg.workspacePath && fs.existsSync(cfg.workspacePath)) {
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

/**
 * 获取当前时间戳（毫秒）
 */
export const getCurrentTimestamp = (): number => Date.now();

/**
 * 将毫秒格式化为易读字符串（例如：1天 2小时 3分钟）
 */
export const formatTime = (ms: number): string => {
  if (!ms || ms <= 0) {return '0秒';}
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days) {parts.push(`${days}天`);}
  if (hours) {parts.push(`${hours}小时`);}
  if (minutes) {parts.push(`${minutes}分钟`);}
  if (seconds) {parts.push(`${seconds}秒`);}
  return parts.join(' ');
};

/**
 * 计算写作速度（字/分钟），输入时间为毫秒
 */
export const calculateWritingSpeed = (words: number, ms: number): number => {
  if (!ms || ms <= 0) {return 0;}
  const minutes = ms / 60000;
  if (minutes <= 0) {return 0;}
  return Math.round(words / minutes);
};



/**
 * 判断当前工作区是否为已初始化的小说工作区（存在关键目录）
 */
export const isNovelWorkspace = (): boolean => {
  // 优先检查配置文件中保存的 workspacePath，兼容用户在初始化时指定的目录
  try {
    const cfg = readConfig();
    const cfgRoot = cfg && cfg.workspacePath && fs.existsSync(cfg.workspacePath) ? cfg.workspacePath : undefined;
    const root = cfgRoot || getWorkspaceRoot();
    if (!root) {return false;}
    const requiredDirs = ['大纲', '设定', '素材', '正文'];
    return requiredDirs.every(d => fs.existsSync(path.join(root, d)));
  } catch {
    // 若读取配置失败，则退化到基于工作区的判断
    const root = getWorkspaceRoot();
    if (!root) {return false;}
    const requiredDirs = ['大纲', '设定', '素材', '正文'];
    return requiredDirs.every(d => fs.existsSync(path.join(root, d)));
  }
};