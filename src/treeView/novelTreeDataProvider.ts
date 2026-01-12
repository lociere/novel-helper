import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NovelTreeItem } from './treeItem';
import { getWorkspaceRoot, isNovelWorkspace, countWords } from '../utils/helpers';
import { getDirFiles } from '../utils/fileSystem';
import { CONFIG_FILE_NAME, getConfigFilePath } from '../utils/config';

const TEXT_EXTS = ['.txt', '.md'];

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

    // 1. 根节点（大纲、设定、素材、正文）
    if (!element) {
      return this.getRootNodes(root);
    }

    // 2. 目录节点处理
    if (element.type === 'directory') {
      const dirPath = this.resolveDirPath(element, root);
      if (!dirPath) {
        return [];
      }

      const children = this.getDirectoryContent(dirPath);
      this.appendCreateButtons(children, dirPath, root);
      return children;
    }

    return [];
  }

  /**
   * 获取根节点列表
   */
  private getRootNodes(root: string): NovelTreeItem[] {
    const predefinedFolders = ['大纲', '设定', '素材', '正文'];
    const roots = predefinedFolders.map(folder => 
      new NovelTreeItem(folder, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, folder)))
    );
    return roots;
  }

  /**
   * 解析目录路径
   */
  private resolveDirPath(element: NovelTreeItem, root: string): string | undefined {
    if (element.resourceUri?.fsPath) {
      return element.resourceUri.fsPath;
    }
    
    // 兼容性处理：如果 resourceUri 丢失，尝试从 label 推断
    const label = typeof element.label === 'string' ? element.label : element.label?.toString();
    if (!label) { return undefined; }
    
    // 仅支持根目录的一级子文件夹回退
    const validRoots = ['大纲', '设定', '素材', '正文'];
    if (validRoots.includes(label)) {
      return path.join(root, label);
    }
    return undefined;
  }

  /**
   * 获取目录下实际存在的文件和文件夹节点
   */
  private getDirectoryContent(dirPath: string): NovelTreeItem[] {
    const configFullPath = getConfigFilePath();
    let allFiles: string[] = [];
    try {
      allFiles = getDirFiles(dirPath);
    } catch {
      return [];
    }

    const children: NovelTreeItem[] = [];

    // 过滤并分类
    const folders: string[] = [];
    const files: string[] = [];

    allFiles.forEach(fileName => {
      if (this.isConfigFile(fileName, dirPath, configFullPath)) { return; }

      const fullPath = path.join(dirPath, fileName);
      const stat = this.safeStat(fullPath);
      if (!stat) { return; }

      if (stat.isDirectory()) {
        folders.push(fileName);
      } else {
        files.push(fileName);
      }
    });

    // 添加文件夹节点
    folders.forEach(f => {
      children.push(new NovelTreeItem(
        f,
        'directory',
        vscode.TreeItemCollapsibleState.Collapsed,
        vscode.Uri.file(path.join(dirPath, f))
      ));
    });

    // 添加文件节点
    files.forEach(f => {
      const filePath = path.join(dirPath, f);
      const item = new NovelTreeItem(
        f,
        'file',
        vscode.TreeItemCollapsibleState.None,
        vscode.Uri.file(filePath)
      );

      if (this.isTextFile(f)) {
        this.attachWordCount(item, filePath);
      }

      children.push(item);
    });

    return children;
  }

  private isTextFile(fileName: string): boolean {
    return TEXT_EXTS.some(ext => fileName.endsWith(ext));
  }

  private attachWordCount(item: NovelTreeItem, filePath: string): void {
    const content = this.safeReadText(filePath);
    if (content === undefined) { return; }
    const count = countWords(content);
    item.description = `${count}字`;
  }

  private isConfigFile(fileName: string, dirPath: string, configFullPath: string): boolean {
    if (fileName === CONFIG_FILE_NAME) { return true; }
    return path.join(dirPath, fileName) === configFullPath;
  }

  private safeStat(fullPath: string): fs.Stats | undefined {
    try {
      return fs.statSync(fullPath);
    } catch {
      return undefined;
    }
  }

  private safeReadText(filePath: string): string | undefined {
    try {
      const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
      return openDoc ? openDoc.getText() : fs.readFileSync(filePath, 'utf-8');
    } catch {
      return undefined;
    }
  }

  /**
   * 根据上下文追加“新建”按钮或虚拟目录
   */
  private appendCreateButtons(children: NovelTreeItem[], dirPath: string, root: string): void {
    const base = path.basename(dirPath);
    const parent = path.dirname(dirPath);
    const isRootFolder = (name: string) => base === name && parent === root;

    // 辅助函数：快速创建按钮
    const addBtn = (label: string, contextVal: string) => {
      children.push(new NovelTreeItem(label, 'create-item', vscode.TreeItemCollapsibleState.None, undefined, contextVal, dirPath));
    };
    
    // 辅助函数：确保虚拟目录存在
    const ensureVirtualDir = (folderName: string) => {
      const exists = children.some(c => typeof c.label === 'string' && c.label === folderName && c.type === 'directory');
      if (!exists) {
        children.push(new NovelTreeItem(
          folderName,
          'directory',
          vscode.TreeItemCollapsibleState.Collapsed,
          vscode.Uri.file(path.join(dirPath, folderName))
        ));
      }
    };

    // 1. 大纲模块
    if (isRootFolder('大纲')) {
      addBtn('新建总大纲', '总大纲');
      addBtn('新建分大纲', '分大纲');
    }
    // 2. 设定模块
    else if (isRootFolder('设定')) {
      ['角色设定', '事物设定'].forEach(ensureVirtualDir);
      addBtn('新建设定文件夹', '设定文件夹');
    }
    // 3. 素材模块
    else if (isRootFolder('素材')) {
      ['图片素材', '文字素材'].forEach(ensureVirtualDir);
      addBtn('新建素材文件夹', '素材文件夹');
    }
    // 4. 正文模块
    else if (isRootFolder('正文')) {
      addBtn('新建分卷', '分卷');
      addBtn('新建章节', '章节');
    }
    // 5. 正文分卷下
    else if (parent === path.join(root, '正文')) {
      addBtn('新建章节', '章节');
    }
    // 6. 子模块内部
    else if (base === '角色设定') { addBtn('新建角色设定', '角色设定'); }
    else if (base === '事物设定') { addBtn('新建事物设定', '事物设定'); }
    else if (base === '图片素材') { addBtn('新建图片素材', '图片素材'); }
    else if (base === '文字素材') { addBtn('新建素材文件', '文字素材'); }
  }
}