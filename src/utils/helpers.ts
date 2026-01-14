import * as vscode from 'vscode';
import * as fs from 'fs';
import { readConfig } from './config';

/** 统计文本字数：中文字符/中文标点按 1，英文单词/数字按 1。 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  let totalCount = 0;

  // 匹配中文字符及常见中文/全角标点（扩展范围）
  const chineseAndPunctuation = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f]/g);
  if (chineseAndPunctuation) {
    totalCount += chineseAndPunctuation.length;
  }

  // 将中文及中文标点替换为空，再统计剩下的单词/数字，避免重复计算
  const remainingText = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f]/g, ' ');

  // 匹配英文单词和数字（连续的字母/数字/下划线/短横线算 1 个词）
  const wordMatches = remainingText.match(/[a-zA-Z0-9_\-]+/g);
  if (wordMatches) {
    totalCount += wordMatches.length;
  }

  return totalCount;
};

/** 获取工作区根路径：优先使用配置中的 workspacePath，否则回退到第一个 workspace folder。 */
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

/** 将毫秒格式化为易读字符串（例如：1天 2小时 3分钟）。 */
export const formatTime = (ms: number): string => {
  if (!ms || ms <= 0) { return '0秒'; }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days) { parts.push(`${days}天`); }
  if (hours) { parts.push(`${hours}小时`); }
  if (minutes) { parts.push(`${minutes}分钟`); }
  if (seconds) { parts.push(`${seconds}秒`); }
  return parts.join(' ');
};

/** 计算写作速度（字/分钟），输入时间为毫秒。 */
export const calculateWritingSpeed = (words: number, ms: number): number => {
  if (!ms || ms <= 0) { return 0; }
  const minutes = ms / 60000;
  if (minutes <= 0) { return 0; }
  return Math.round(words / minutes);
};
