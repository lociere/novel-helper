import * as vscode from 'vscode';
import * as path from 'path';
import { createDir, createFile, getWorkspaceRoot } from '../utils/fileSystem';
import { writeConfig, CONFIG_FILE_NAME } from '../utils/config';

/**
 * 初始化小说工作区
 */
export const initWorkspace = async (): Promise<void> => {
  const root = getWorkspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage('未找到工作区，请先打开一个文件夹');
    return;
  }

  // 创建标准目录结构
  const dirs = [
    '大纲',
    '设定/角色设定',
    '设定/事物设定',
    '素材/图片素材',
    '素材/文字素材',
    '正文/分卷1'
  ];

  dirs.forEach(dir => {
    createDir(path.join(root, dir));
  });

  // 创建初始文件
  createFile(path.join(root, '大纲/总大纲.md'), '# 总大纲\n\n');
  createFile(path.join(root, '设定/角色设定/主角.md'), '# 主角设定\n\n');
  createFile(path.join(root, '正文/分卷1/第一章.txt'), '');

  // 写入配置文件
  writeConfig({ workspacePath: root });

  vscode.window.showInformationMessage('小说工作区初始化成功！');

  // 刷新资源管理器：尝试多个可能的命令并捕获错误以防命令不存在
  const refreshCommands = [
    'workbench.files.action.refreshFilesExplorer',
    'workbench.action.files.refreshFiles',
    'workbench.files.action.refresh'
  ];
  for (const cmd of refreshCommands) {
    try {
      // 某些命令在不同版本或平台上可能不存在，因此用 try/catch 包裹
      // 使用 await 避免未处理的 promise 拒绝
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await vscode.commands.executeCommand(cmd);
      break;
    } catch (err) {
      // 如果命令不存在或执行失败，继续尝试下一个命令
      // 最终若都失败则静默忽略，避免抛出未处理异常
      // 仅在开发者工具里打印以便调试
      // eslint-disable-next-line no-console
      console.warn(`刷新资源管理器命令 '${cmd}' 无法执行，已忽略。`, err);
    }
  }
};