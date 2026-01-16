import * as vscode from 'vscode';
import { AutoLayoutManager } from './autoLayoutManager';

/**
 * 注册“编辑行为增强”能力。
 *
 * 职责边界：
 * - 该模块负责编辑器交互行为（例如回车自动排版）。
 * - 文本格式化能力由 formatter 模块负责。
 */
export const registerEditorBehavior = (context: vscode.ExtensionContext): vscode.Disposable => {
  const autoLayout = new AutoLayoutManager(context);
  context.subscriptions.push(autoLayout);
  return vscode.Disposable.from(autoLayout);
};
