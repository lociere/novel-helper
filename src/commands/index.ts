import * as vscode from 'vscode';
import { initWorkspace } from './initWorkspace';
import { createItem, CreateItemType } from './createItems';

/**
 * 注册所有命令
 * @param context 扩展上下文
 */
export const registerCommands = (context: vscode.ExtensionContext): void => {
  // 初始化工作区
  const initWorkspaceCmd = vscode.commands.registerCommand('novel-helper.initWorkspace', initWorkspace);
  context.subscriptions.push(initWorkspaceCmd);

  // 创建小说项
  const createItemCmd = vscode.commands.registerCommand('novel-helper.createItem', (type: CreateItemType, parentPath?: string) => {
    createItem(type, parentPath);
  });
  context.subscriptions.push(createItemCmd);

  // 格式化文档
  const formatDocumentCmd = vscode.commands.registerCommand('novel-helper.formatDocument', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('未打开编辑器');
      return;
    }
    await vscode.commands.executeCommand('editor.action.formatDocument');
  });
  context.subscriptions.push(formatDocumentCmd);

  // 打开配置面板
  const openConfigPanelCmd = vscode.commands.registerCommand('novel-helper.openConfigPanel', () => {
    vscode.commands.executeCommand('novel-helper.showConfigPanel');
  });
  context.subscriptions.push(openConfigPanelCmd);
};