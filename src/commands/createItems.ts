import * as vscode from 'vscode';
import * as path from 'path';
import { getWorkspaceRoot } from '../utils/helpers';
import { ensureDir, writeTextFileIfMissing } from '../utils/workspaceFs';

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


/** 创建文件/目录的核心逻辑（命令交互在 createItem 中处理）。 */
const createItemCore = async (type: CreateItemType, name: string, basePath?: string): Promise<void> => {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('未找到工作区根路径，请先打开小说工作区！');
    return;
  }

  const trimmedName = name?.trim();
  if (!trimmedName) {
    vscode.window.showErrorMessage('项目名称不能为空！');
    return;
  }

  // 获取对应类型的配置
  const config: CreateItemConfig | undefined = CREATE_ITEM_CONFIG[type];
  if (!config) {
    vscode.window.showErrorMessage(`不支持的创建类型：${type}`);
    return;
  }

  if (!config.isDir && !config.ext) {
    vscode.window.showErrorMessage('文件类型未指定，无法创建文件');
    return;
  }

  const dirPath = resolveTargetDir(basePath, config.dir, workspaceRoot);
  let targetPath = '';
  
  // 确保父目录存在（VS Code 内置文件系统 API）
  await ensureDir(vscode.Uri.file(dirPath));

  // 根据配置创建目录/文件
  if (config.isDir) {
    targetPath = path.join(dirPath, trimmedName);
    await ensureDir(vscode.Uri.file(targetPath));
  } else {
    const fileName = `${trimmedName}.${config.ext!}`;
    targetPath = path.join(dirPath, fileName);
    const content = config.template?.replace(/{{name}}/g, trimmedName) || '';

    // 与旧行为保持一致：若文件已存在则视为成功且不覆盖内容
    await writeTextFileIfMissing(vscode.Uri.file(targetPath), content);
  }

  if (targetPath) {
    vscode.window.showInformationMessage(`成功创建${type}：${trimmedName}`);
    // 刷新树视图以立即展示新创建的文件/目录
    try {
      vscode.commands.executeCommand('novelTreeView.refresh');
    } catch {
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
      void createItemCore(type, name, parentPath);
    }
  });
};
