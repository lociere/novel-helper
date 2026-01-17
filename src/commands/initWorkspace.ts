import * as vscode from 'vscode';
import * as path from 'path';
import { getWorkspaceRoot } from '../utils/fs';
import { updateNovelHelperSetting } from '../config';
import { ensureDir, writeTextFileIfMissing } from '../utils/fs';

/**
 * 开启小说工作区：创建标准目录结构与示例文件，并写入 Novel Helper 配置。
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

  // 使用 VS Code 的 workspace.fs 创建目录（跨平台、可适配远程文件系统）
  await Promise.all(
    dirs.map(dir => ensureDir(vscode.Uri.file(path.join(root, dir))))
  );

  // 创建初始文件
  await writeTextFileIfMissing(vscode.Uri.file(path.join(root, '大纲/总大纲.md')), '# 总大纲\n\n');
  await writeTextFileIfMissing(vscode.Uri.file(path.join(root, '设定/角色设定/主角.md')), '# 主角设定\n\n');
  await writeTextFileIfMissing(vscode.Uri.file(path.join(root, '正文/分卷1/第一章.txt')), '');

  // 写入配置（同时同步写入工作区 settings）
  await updateNovelHelperSetting('workspacePath', root, vscode.ConfigurationTarget.Workspace);

  // 更新工作区设置：隐藏无关文件以减少其他插件干扰
  const config = vscode.workspace.getConfiguration();
  const excludes: Record<string, boolean> = {
    '**/*.js': true,
    '**/*.ts': true,
    '**/*.jsx': true,
    '**/*.tsx': true,
    '**/*.py': true,
    '**/*.java': true,
    '**/*.c': true,
    '**/*.cpp': true,
    '**/*.go': true,
    '**/*.php': true,
    '**/*.rb': true,
    '**/*.rs': true,
    '**/*.cs': true,
    '**/*.html': true,
    '**/*.css': true,
    'node_modules': true,
    '.git': true,
    '.svn': true,
    '.hg': true
  };

  const currentExcludes = config.get<Record<string, boolean>>('files.exclude') || {};
  await config.update('files.exclude', { ...currentExcludes, ...excludes }, vscode.ConfigurationTarget.Workspace);

  vscode.window.showInformationMessage('小说工作区已开启！已自动屏蔽代码文件。');

  // 刷新资源管理器：尝试多个可能的命令并捕获错误以防命令不存在
  const refreshCommands = [
    'workbench.files.action.refreshFilesExplorer',
    'workbench.action.files.refreshFiles',
    'workbench.files.action.refresh'
  ];
  for (const cmd of refreshCommands) {
    try {
      // 某些命令在不同版本或平台上可能不存在，因此用 try/catch 包裹
      await vscode.commands.executeCommand(cmd);
      break;
    } catch (err) {
      // 如果命令不存在或执行失败，继续尝试下一个命令；最终若都失败则静默忽略
      console.warn(`刷新资源管理器命令 '${cmd}' 无法执行，已忽略。`, err);
    }
  }

  // 标记已初始化，供命令显隐控制
  void vscode.commands.executeCommand('setContext', 'novelHelper.initialized', true);
};