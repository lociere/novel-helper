import * as vscode from 'vscode';
import * as path from 'path';
import { createDir, createFile } from '../utils/fileSystem';
import { getWorkspaceRoot } from '../utils/helpers';

/**
 * 项目创建配置常量（优化：统一管理路径、模板、类型，减少重复代码）
 */
const CREATE_ITEM_CONFIG = {
  '总大纲': { dir: '大纲', ext: 'md', template: `# {{name}}\n\n`, isDir: false },
  '分大纲': { dir: '大纲', ext: 'md', template: `## {{name}}\n\n`, isDir: false },
  '角色设定': { dir: '设定/角色设定', ext: 'md', template: `# {{name}} 设定\n\n`, isDir: false },
  '事物设定': { dir: '设定/事物设定', ext: 'md', template: `# {{name}} 设定\n\n`, isDir: false },
  '图片素材': { dir: '素材/图片素材', isDir: true },
  '文字素材': { dir: '素材/文字素材', ext: 'md', template: `# {{name}} 素材\n\n`, isDir: false },
  '分卷': { dir: '正文', isDir: true },
  '章节': { dir: '正文', ext: 'txt', template: '', isDir: false }
};

/**
 * 创建小说相关项目（总大纲、分大纲、角色设定等）
 * @param type 项目类型
 * @param name 项目名称
 */
export const createItems = (type: string, name: string): void => {
  const basePath = getWorkspaceRoot();
  if (!basePath) {
    vscode.window.showErrorMessage('未找到工作区根路径，请先打开小说工作区！');
    return;
  }

  if (!name || name.trim() === '') {
    vscode.window.showErrorMessage('项目名称不能为空！');
    return;
  }
  name = name.trim(); // 去除首尾空格

  // 获取对应类型的配置
  const config = CREATE_ITEM_CONFIG[type];
  if (!config) {
    vscode.window.showErrorMessage(`不支持的创建类型：${type}`);
    return;
  }

  let targetPath = '';
  // 拼接基础目录路径
  const dirPath = config.dir ? path.join(basePath, config.dir) : basePath;
  
  // 确保父目录存在
  const dirCreated = createDir(dirPath);
  if (!dirCreated) {
    return; // 目录创建失败则终止
  }

  // 根据配置创建目录/文件
  if (config.isDir) {
    targetPath = path.join(dirPath, name);
    createDir(targetPath);
  } else {
    const fileName = `${name}.${config.ext}`;
    targetPath = path.join(dirPath, fileName);
    // 替换模板中的名称占位符
    const content = config.template?.replace(/{{name}}/g, name) || '';
    createFile(targetPath, content);
  }

  if (targetPath) {
    vscode.window.showInformationMessage(`成功创建${type}：${name}`);
  }
};

/**
 * 注册创建项目命令
 * @param context 扩展上下文
 */
export const registerCreateItemsCommand = (context: vscode.ExtensionContext): void => {
  const disposable = vscode.commands.registerCommand('novel-helper.createItems', (type: string) => {
    vscode.window.showInputBox({
      prompt: `请输入${type}名称`,
      placeHolder: `例如：${type === '章节' ? '第一章 序章' : type}`,
      validateInput: (value) => {
        // 增加输入验证：禁止非法字符
        if (value && /[\\/:*?"<>|]/.test(value)) {
          return '名称不能包含 \\ / : * ? " < > | 等字符！';
        }
        return null;
      }
    }).then(name => {
      if (name) {
        createItems(type, name);
      }
    });
  });

  context.subscriptions.push(disposable);
};