import * as vscode from 'vscode';
import * as path from 'path';
import { createDir, createFile } from '../utils/fileSystem';
import { getWorkspaceRoot } from '../utils/helpers';

/**
 * 项目创建配置常量（优化：统一管理路径、模板、类型，减少重复代码）
 */
const CREATE_ITEM_CONFIG = {
  '总大纲': { dir: '大纲', ext: 'md', template: '# {{name}}\n\n', isDir: false },
  '分大纲': { dir: '大纲', ext: 'md', template: '## {{name}}\n\n', isDir: false },
  '角色设定': { dir: '设定/角色设定', ext: 'md', template: '# {{name}} 设定\n\n', isDir: false },
  '事物设定': { dir: '设定/事物设定', ext: 'md', template: '# {{name}} 设定\n\n', isDir: false },
  '图片素材': { dir: '素材/图片素材', isDir: true },
  '文字素材': { dir: '素材/文字素材', ext: 'md', template: '# {{name}} 素材\n\n', isDir: false },
  '设定文件夹': { dir: '设定', isDir: true },
  '素材文件夹': { dir: '素材', isDir: true },
  '分卷': { dir: '正文', isDir: true },
  '章节': { dir: '正文', ext: 'txt', template: '', isDir: false }
} as const;

export type CreateItemType = keyof typeof CREATE_ITEM_CONFIG;

type CreateItemConfig = {
  dir: string;
  ext?: string;
  template?: string;
  isDir: boolean;
};

/**
 * 解析目标目录路径
 * @param basePath 用户传入的基础路径
 * @param configBaseDir 配置中的基础目录
 * @param workspaceRoot 工作区根目录
 */
const resolveTargetDir = (basePath: string | undefined, configBaseDir: string, workspaceRoot: string): string => {
  if (basePath) {
    if (path.isAbsolute(basePath)) {
      return basePath;
    }
    return path.join(workspaceRoot, basePath);
  }
  return path.join(workspaceRoot, configBaseDir);
};


/**
 * 创建小说相关项目（总大纲、分大纲、角色设定等）
 * @param type 项目类型
 * @param name 项目名称
 * @param basePath 可选：用于在指定路径下创建（默认工作区根路径）
 */
export const createItems = (type: CreateItemType, name: string, basePath?: string): void => {
  const base = basePath || getWorkspaceRoot();
  if (!base) {
    vscode.window.showErrorMessage('未找到工作区根路径，请先打开小说工作区！');
    return;
  }

  if (!name || name.trim() === '') {
    vscode.window.showErrorMessage('项目名称不能为空！');
    return;
  }
  name = name.trim(); // 去除首尾空格

  // 获取对应类型的配置
  const config: CreateItemConfig | undefined = (CREATE_ITEM_CONFIG as Record<string, CreateItemConfig>)[type as string];
  if (!config) {
    vscode.window.showErrorMessage(`不支持的创建类型：${type}`);
    return;
  }

  // 1. 确定目标目录
  // 注意：我们需要确定的工作区根目录来处理相对路径
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    // 理论上前面 base 检查已涵盖，但为了 resolveTargetDir 类型安全
    return;
  }
  const dirPath = resolveTargetDir(basePath, config.dir, workspaceRoot);
  let targetPath = '';
  
  // 确保父目录存在
  const dirCreated = createDir(dirPath);
  if (!dirCreated) {
    return; // 目录创建失败则终止
  }

  // 根据配置创建目录/文件
  let created = false;
  if (config.isDir) {
    targetPath = path.join(dirPath, name);
    created = createDir(targetPath);
    if (!created) {
      vscode.window.showErrorMessage(`创建目录失败：${targetPath}`);
      return;
    }
  } else {
    if (!config.ext) {
      vscode.window.showErrorMessage('文件类型未指定，无法创建文件');
      return;
    }
    const fileName = `${name}.${config.ext}`;
    targetPath = path.join(dirPath, fileName);
    // 替换模板中的名称占位符
    const content = config.template?.replace(/{{name}}/g, name) || '';
    created = createFile(targetPath, content);
    if (!created) {
      // createFile 已显示提示（如文件已存在），直接返回
      return;
    }
  }

  if (created && targetPath) {
    vscode.window.showInformationMessage(`成功创建${type}：${name}`);
    // 刷新树视图以立即展示新创建的文件/目录
    try {
      vscode.commands.executeCommand('novelTreeView.refresh');
    } catch (e) {
      // 忽略刷新失败
    }
  }
};

/**
 * 提供命令式创建接口，支持通过 parentPath 在指定目录创建
 */
export const createItem = (type: CreateItemType, parentPath?: string): void => {
  vscode.window.showInputBox({
    prompt: `请输入${type}名称`,
    placeHolder: `例如：${type === '章节' ? '第一章 序章' : type}`,
    validateInput: (value) => {
      // 增加输入验证：禁止非法字符
      if (value && /[\\/:*?"<>|]/.test(value)) {
        return '名称不能包含 \\ / : * ? " < > | 等字符！';
      }
      return undefined;
    }
  }).then(name => {
    if (name) {
      createItems(type, name, parentPath);
    }
  });
};

/**
 * 注册创建项目命令
 * @param context 扩展上下文
 */
export const registerCreateItemsCommand = (context: vscode.ExtensionContext): void => {
  const disposable = vscode.commands.registerCommand('novel-helper.createItem', (type: CreateItemType, parentPath?: string) => {
    createItem(type, parentPath);
  });

  context.subscriptions.push(disposable);
};