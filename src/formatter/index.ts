import * as vscode from 'vscode';
import { Formatter } from './formatter';

export * from './formatCore'; 
export * from './formatConfigBuilder';

/**
 * 注册格式化管理器
 */
export const registerFormatter = (): vscode.Disposable => {
  const formatter = new Formatter();
  // Formatter constructor handles registration and subscription
  return formatter;
};
