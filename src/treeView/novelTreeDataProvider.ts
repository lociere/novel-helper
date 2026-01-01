import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NovelTreeItem } from './treeItem';
import { getWorkspaceRoot, isNovelWorkspace, getDirFiles } from '../utils/fileSystem';

/** 小说树数据提供器 */
export class NovelTreeDataProvider implements vscode.TreeDataProvider<NovelTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<NovelTreeItem | undefined | null | void> = new vscode.EventEmitter<NovelTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<NovelTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  /** 刷新树视图 */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /** 获取树节点 */
  getTreeItem(element: NovelTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  /** 获取子节点 */
  getChildren(element?: NovelTreeItem): vscode.ProviderResult<NovelTreeItem[]> {
    // 非小说工作区，提示初始化
    if (!isNovelWorkspace()) {
      return [
        new NovelTreeItem(
          '未初始化小说工作区，点击初始化',
          'create-item',
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'init',
          undefined
        )
      ];
    }

    const root = getWorkspaceRoot()!;

    // 根节点
    if (!element) {
      return [
        // 大纲
        new NovelTreeItem('大纲', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '大纲'))),
        // 设定
        new NovelTreeItem('设定', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '设定'))),
        // 素材
        new NovelTreeItem('素材', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '素材'))),
        // 正文
        new NovelTreeItem('正文', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '正文')))
      ];
    }

    // 目录节点
    if (element.type === 'directory') {
      const dirPath = element.resourceUri!.fsPath;
      const files = getDirFiles(dirPath);
      const children: NovelTreeItem[] = [];

      // 添加新建节点
      switch (path.basename(dirPath)) {
        case '大纲':
          children.push(new NovelTreeItem('新建总大纲', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '总大纲', root));
          children.push(new NovelTreeItem('新建分大纲', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '分大纲', root));
          break;
        case '角色设定':
          children.push(new NovelTreeItem('新建角色设定', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '角色设定', path.dirname(dirPath)));
          break;
        case '事物设定':
          children.push(new NovelTreeItem('新建事物设定', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '事物设定', path.dirname(dirPath)));
          break;
        case '图片素材':
          children.push(new NovelTreeItem('新建图片素材文件夹', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '图片素材', path.dirname(dirPath)));
          break;
        case '文字素材':
          children.push(new NovelTreeItem('新建文字素材', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '文字素材', path.dirname(dirPath)));
          break;
        case '正文':
          children.push(new NovelTreeItem('新建分卷', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '分卷', root));
          break;
        default:
          // 分卷目录，添加新建章节
          if (path.dirname(dirPath) === path.join(root, '正文')) {
            children.push(new NovelTreeItem('新建章节', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '章节', dirPath));
          }
          break;
      }

      // 添加文件/子目录
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          children.push(new NovelTreeItem(
            file,
            'directory',
            vscode.TreeItemCollapsibleState.Collapsed,
            vscode.Uri.file(filePath)
          ));
        } else {
          children.push(new NovelTreeItem(
            file,
            'file',
            vscode.TreeItemCollapsibleState.None,
            vscode.Uri.file(filePath)
          ));
        }
      });

      return children;
    }

    // 其他节点无子女
    return [];
  }
}