import * as vscode from 'vscode';
import * as path from 'path';
import { createDir, createFile, getWorkspaceRoot } from '../utils/fileSystem';

/** 可创建的项类型 */
export type CreateItemType = 
  | '总大纲' 
  | '分大纲' 
  | '角色设定' 
  | '事物设定' 
  | '图片素材' 
  | '文字素材' 
  | '分卷' 
  | '章节';

/**
 * 创建小说项
 * @param type 项类型
 * @param parentPath 父路径
 */
export const createItem = async (type: CreateItemType, parentPath?: string): Promise<void> => {
  const root = getWorkspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage('未找到工作区');
    return;
  }

  // 输入名称
  const name = await vscode.window.showInputBox({
    prompt: `请输入${type}名称`,
    placeHolder: type,
    validateInput: (value) => {
      if (!value) {
        return '名称不能为空';
      }
      return null;
    }
  });

  if (!name) {
    return;
  }

  // 确定路径和文件类型
  let targetPath: string;
  const basePath = parentPath || root;

  switch (type) {
    case '总大纲':
      targetPath = path.join(basePath, '大纲', `${name}.md`);
      createFile(targetPath, `# ${name}\n\n`);
      break;
    case '分大纲':
      targetPath = path.join(basePath, '大纲', `${name}.md`);
      createFile(targetPath, `## ${name}\n\n`);
      break;
    case '角色设定':
      targetPath = path.join(basePath, '设定/角色设定', `${name}.md`);
      createFile(targetPath, `# ${name} 设定\n\n`);
      break;
    case '事物设定':
      targetPath = path.join(basePath, '设定/事物设定', `${name}.md`);
      createFile(targetPath, `# ${name} 设定\n\n`);
      break;
    case '图片素材':
      targetPath = path.join(basePath, '素材/图片素材', name);
      createDir(targetPath);
      break;
    case '文字素材':
      targetPath = path.join(basePath, '素材/文字素材', `${name}.md`);
      createFile(targetPath, `# ${name} 素材\n\n`);
      break;
    case '分卷':
      targetPath = path.join(basePath, '正文', name);
      createDir(targetPath);
      break;
    case '章节':
      targetPath = path.join(basePath, `${name}.txt`);
      createFile(targetPath, '');
      break;
  }

  // 刷新树视图
  vscode.commands.executeCommand('novelTreeView.refresh');
};