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

  // 新增：路径与操作映射配置
const itemConfigMap: Record<CreateItemType, { subPath: string; isDir: boolean; template?: string }> = {
  '总大纲': { subPath: '大纲', isDir: false, template: `# {{name}}\n\n` },
  '分大纲': { subPath: '大纲', isDir: false, template: `## {{name}}\n\n` },
  '角色设定': { subPath: '设定/角色设定', isDir: false, template: `# {{name}} 设定\n\n` },
  '事物设定': { subPath: '设定/事物设定', isDir: false, template: `# {{name}} 设定\n\n` },
  '图片素材': { subPath: '素材/图片素材', isDir: true },
  '文字素材': { subPath: '素材/文字素材', isDir: false, template: `# {{name}} 素材\n\n` },
  '分卷': { subPath: '正文', isDir: true },
  '章节': { subPath: '', isDir: false, template: '' }, // 章节路径由parentPath决定
};

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
  const basePath = parentPath || root;
  const config = itemConfigMap[type];
  let targetPath: string;


  if (type === '章节') {
    targetPath = path.join(basePath, `${name}.txt`);
  } else {
    const fullSubPath = path.join(basePath, config.subPath);
    targetPath = config.isDir 
      ? path.join(fullSubPath, name) 
      : path.join(fullSubPath, `${name}.md`);
  }

  // 执行创建操作
  if (config.isDir) {
    createDir(targetPath);
  } else {
    const content = config.template?.replace('{{name}}', name) || '';
    createFile(targetPath, content);
  }

  // 刷新树视图
  vscode.commands.executeCommand('novelTreeView.refresh');
};