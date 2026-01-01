import * as vscode from 'vscode';
import dayjs from 'dayjs';

/**
 * 计算文本字数（含中文、英文、数字，不含空格和换行）
 * @param text 文本内容
 * @returns 字数
 */
export const countWords = (text: string): number => {
  if (!text) {
    return 0;
  }
  // 移除空格和换行
  const cleanText = text.replace(/\s/g, '');
  return cleanText.length;
};

/**
 * 格式化时间（秒转时分秒）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h > 0 ? `${h}小时` : ''}${m > 0 ? `${m}分钟` : ''}${s}秒`;
};

/**
 * 计算码字速度（字/分钟）
 * @param wordCount 字数变化
 * @param duration 时长（秒）
 * @returns 速度
 */
export const calculateWritingSpeed = (wordCount: number, duration: number): number => {
  if (duration === 0 || wordCount === 0) {
    return 0;
  }
  const minutes = duration / 60;
  return Math.round(wordCount / minutes);
};

/**
 * 获取选中的文本
 * @returns 选中的文本
 */
export const getSelectedText = (): string => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return '';
  }
  const selection = editor.selection;
  if (selection.isEmpty) {
    return '';
  }
  return editor.document.getText(selection);
};

/**
 * 格式化数字（补零）
 * @param num 数字
 * @param length 长度
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number, length = 2): string => {
  return num.toString().padStart(length, '0');
};

/**
 * 获取当前时间戳（秒）
 * @returns 时间戳
 */
export const getCurrentTimestamp = (): number => {
  return dayjs().unix();
};