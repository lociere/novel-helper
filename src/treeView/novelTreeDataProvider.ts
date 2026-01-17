import * as vscode from 'vscode';
import * as path from 'path';
import { NovelTreeItem } from './treeItem';
import { getWorkspaceRoot } from '../utils/fs';
import { countWords } from '../utils/text';
import { isWorkspaceInitialized } from '../config';
import { readTextFile } from '../utils/fs';
import { sortTreeItems } from './sorter';
import { isTextFile, isConfigFile, resolveDirPath, PREDEFINED_ROOTS } from './utils';

const LARGE_TEXT_FILE_BYTES = 500_000;

/** 小说树数据提供器 */
export class NovelTreeDataProvider implements vscode.TreeDataProvider<NovelTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<NovelTreeItem | undefined | null | void> = new vscode.EventEmitter<NovelTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<NovelTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  // 缓存节点引用，用于局部刷新
  private itemCache = new Map<string, NovelTreeItem>();

  /** 刷新树视图 */
  refresh(): void {
    this.itemCache.clear();
    this._onDidChangeTreeData.fire();
  }

  /** 仅刷新单个文件的节点（例如更新字数），避免整个树抖动 */
  async refreshFile(uri: vscode.Uri): Promise<void> {
    const item = this.itemCache.get(uri.fsPath);
    if (!item) { return; }

    // 更新字数（复用 attachWordCount 逻辑，支持打开文档或磁盘读取）
    await this.attachWordCount(item, uri.fsPath);
    this._onDidChangeTreeData.fire(item);
  }

  getTreeItem(element: NovelTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }


  getChildren(element?: NovelTreeItem): vscode.ProviderResult<NovelTreeItem[]> {
    if (!isWorkspaceInitialized()) {
      return [
        new NovelTreeItem(
          '未开启小说工作区，点击开启',
          'create-item',
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'init',
          undefined
        )
      ];
    }

    const root = getWorkspaceRoot();
    if (!root) {
      return [];
    }

    // 1. 根节点
    if (!element) {
      return this.getRootNodes(root);
    }

    // 2. 目录节点内容
    if (element.type === 'directory') {
      const dirPath = this.resolvePath(element, root);
      if (!dirPath) {
        return [];
      }

      return this.getDirectoryContent(dirPath).then(children => {
        this.appendCreateButtons(children, dirPath, root);
        return sortTreeItems(children, dirPath);
      });
    }

    return [];
  }

  private getRootNodes(root: string): NovelTreeItem[] {
    return PREDEFINED_ROOTS.map(folder => 
      new NovelTreeItem(folder, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, folder)))
    );
  }

  private resolvePath(element: NovelTreeItem, root: string): string | undefined {
    if (element.resourceUri?.fsPath) {
      return element.resourceUri.fsPath;
    }
    const label = typeof element.label === 'string' ? element.label : element.label?.toString();
    return resolveDirPath(root, label);
  }

  private async getDirectoryContent(dirPath: string): Promise<NovelTreeItem[]> {
    const children: NovelTreeItem[] = [];
    let entries: Array<[string, vscode.FileType]> = [];

    try {
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
    } catch {
      return children;
    }

    for (const [name, type] of entries) {
      if (isConfigFile(name)) { continue; }

      if (type === vscode.FileType.Directory) {
        children.push(new NovelTreeItem(
          name,
          'directory',
          vscode.TreeItemCollapsibleState.Collapsed,
          vscode.Uri.file(path.join(dirPath, name))
        ));
        continue;
      }

      if (type !== vscode.FileType.File) { continue; }

      const filePath = path.join(dirPath, name);
      const item = new NovelTreeItem(
        name,
        'file',
        vscode.TreeItemCollapsibleState.None,
        vscode.Uri.file(filePath)
      );

      // 缓存文件节点
      this.itemCache.set(filePath, item);

      if (isTextFile(name)) {
        await this.attachWordCount(item, filePath);
      }

      children.push(item);
    }

    return children;
  }

  private async attachWordCount(item: NovelTreeItem, filePath: string): Promise<void> {
    try {
      const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
      if (openDoc) {
        item.description = `${countWords(openDoc.getText())}字`;
        return;
      }

      const uri = vscode.Uri.file(filePath);
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.size > LARGE_TEXT_FILE_BYTES) {
        return;
      }

      const content = await readTextFile(uri);
      item.description = `${countWords(content)}字`;
    } catch {
      // ignore
    }
  }

  /**
   * 根据上下文追加“新建”按钮或虚拟目录
   */
  private appendCreateButtons(children: NovelTreeItem[], dirPath: string, root: string): void {
    const base = path.basename(dirPath);
    const parent = path.dirname(dirPath);
    const isRootFolder = (name: string) => base === name && parent === root;

    const addBtn = (label: string, contextVal: string) => {
      children.push(new NovelTreeItem(label, 'create-item', vscode.TreeItemCollapsibleState.None, undefined, contextVal, dirPath));
    };
    
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

    if (isRootFolder('大纲')) {
      addBtn('新建总大纲', '总大纲');
      addBtn('新建分大纲', '分大纲');
    }
    else if (isRootFolder('设定')) {
      ['角色设定', '事物设定'].forEach(ensureVirtualDir);
      addBtn('新建设定文件夹', '设定文件夹');
    }
    else if (isRootFolder('素材')) {
      ['图片素材', '文字素材'].forEach(ensureVirtualDir);
      addBtn('新建素材文件夹', '素材文件夹');
    }
    else if (isRootFolder('正文')) {
      addBtn('新建分卷', '分卷');
      addBtn('新建章节', '章节');
    }
    else if (parent === path.join(root, '正文')) {
      addBtn('新建章节', '章节');
    }
    else if (base === '角色设定') { addBtn('新建角色设定', '角色设定'); }
    else if (base === '事物设定') { addBtn('新建事物设定', '事物设定'); }
    else if (base === '图片素材') { addBtn('新建图片素材', '图片素材'); }
    else if (base === '文字素材') { addBtn('新建素材文件', '文字素材'); }
  }
}
