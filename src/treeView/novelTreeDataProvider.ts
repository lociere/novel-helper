import * as vscode from 'vscode';
import * as path from 'path';
import { NovelTreeItem } from './treeItem';
import { getWorkspaceRoot, countWords } from '../utils/helpers';
import { CONFIG_FILE_NAME, isWorkspaceInitialized } from '../utils/config';
import { readTextFile } from '../utils/workspaceFs';

const TEXT_EXTS = ['.txt', '.md'];
const LARGE_TEXT_FILE_BYTES = 500_000;

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
    // 非已开启工作区：提供一键开启入口（树视图通常不会在未开启时注册，但这里做兜底）
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

      return this.getDirectoryContent(dirPath).then(children => {
        this.appendCreateButtons(children, dirPath, root);
        // 子节点排序：目录/文件按名称排序，“新建”按钮固定置底，避免影响观感。
        return this.sortChildren(children, dirPath);
      });
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
  private async getDirectoryContent(dirPath: string): Promise<NovelTreeItem[]> {
    const children: NovelTreeItem[] = [];
    let entries: Array<[string, vscode.FileType]> = [];

    try {
      // VS Code 内置：一次调用拿到名称与类型，避免对每个子项 statSync。
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
    } catch {
      return children;
    }

    for (const [name, type] of entries) {
      if (this.isConfigFile(name)) { continue; }

      if (type === vscode.FileType.Directory) {
        children.push(new NovelTreeItem(
          name,
          'directory',
          vscode.TreeItemCollapsibleState.Collapsed,
          vscode.Uri.file(path.join(dirPath, name))
        ));
        continue;
      }

      // 仅处理普通文件（忽略 SymbolicLink 等特殊类型）
      if (type !== vscode.FileType.File) { continue; }

      const filePath = path.join(dirPath, name);
      const item = new NovelTreeItem(
        name,
        'file',
        vscode.TreeItemCollapsibleState.None,
        vscode.Uri.file(filePath)
      );

      if (this.isTextFile(name)) {
        await this.attachWordCount(item, filePath);
      }

      children.push(item);
    }

    return children;
  }

  private readonly collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });
  private compareByName = (a: string, b: string): number => this.collator.compare(a, b);

  private getDirContext(dirPath: string): '正文' | '大纲' | 'default' {
    const base = path.basename(dirPath);
    if (base === '正文') { return '正文'; }
    if (base === '大纲') { return '大纲'; }
    // 正文下的分卷目录，也按正文规则排序
    const parent = path.basename(path.dirname(dirPath));
    if (parent === '正文') { return '正文'; }
    return 'default';
  }

  private parseChineseNumber(raw: string): number | null {
    const s = raw.replace(/[\s　]+/g, '');
    if (!s) { return null; }

    const digitMap: Record<string, number> = {
      '零': 0,
      '〇': 0,
      '一': 1,
      '二': 2,
      '两': 2,
      '三': 3,
      '四': 4,
      '五': 5,
      '六': 6,
      '七': 7,
      '八': 8,
      '九': 9
    };

    // 纯数字串：一二三（不含十百千）
    if (/^[零〇一二两三四五六七八九]+$/.test(s)) {
      let n = 0;
      for (const ch of s) {
        n = n * 10 + (digitMap[ch] ?? 0);
      }
      return n;
    }

    // 含单位：十百千（支持到 9999 左右的常见章节/卷号）
    if (!/^[零〇一二两三四五六七八九十百千]+$/.test(s)) { return null; }

    let result = 0;
    let current = 0;

    const flushUnit = (unit: number) => {
      const v = current === 0 ? 1 : current;
      result += v * unit;
      current = 0;
    };

    for (const ch of s) {
      if (ch === '千') { flushUnit(1000); continue; }
      if (ch === '百') { flushUnit(100); continue; }
      if (ch === '十') { flushUnit(10); continue; }
      const d = digitMap[ch];
      if (typeof d === 'number') { current = d; }
    }
    result += current;
    return result > 0 ? result : null;
  }

  private parseLeadingIndex(name: string): number | null {
    const trimmed = name.trim();

    // 常见：第十二章 / 第十二卷 / 第12章
    const m1 = trimmed.match(/^第\s*([0-9]+)\s*[卷章节回话部集]?/);
    if (m1) { return Number(m1[1]); }
    const m2 = trimmed.match(/^第\s*([零〇一二两三四五六七八九十百千]+)\s*[卷章节回话部集]?/);
    if (m2) { return this.parseChineseNumber(m2[1]); }

    // 纯数字前缀：01 xxx / 1. xxx / 1、xxx
    const m3 = trimmed.match(/^([0-9]+)\s*([\.、_\-\s]|$)/);
    if (m3) { return Number(m3[1]); }

    // 纯中文数字前缀：一 二 三 / 十二
    const m4 = trimmed.match(/^([零〇一二两三四五六七八九十百千]+)\s*([\.、_\-\s]|$)/);
    if (m4) { return this.parseChineseNumber(m4[1]); }

    return null;
  }

  private getSpecialGroup(name: string, ctx: '正文' | '大纲' | 'default'): number {
    if (ctx === '大纲') {
      if (name.includes('总大纲')) { return 0; }
      if (name.includes('分大纲')) { return 1; }
      return 2;
    }
    if (ctx === '正文') {
      // 序章/楔子等放在最前，但仍保持小于第一章
      if (/^(序章|楔子|引子|前言)/.test(name)) { return 0; }
      // 正文常规章节/卷：走编号排序
      return 1;
    }
    return 0;
  }

  private buildSortKey(item: NovelTreeItem, ctx: '正文' | '大纲' | 'default', originalIndex: number): {
    typeRank: number;
    groupRank: number;
    numberRank: number;
    name: string;
    originalIndex: number;
  } {
    const name = typeof item.label === 'string' ? item.label : item.label?.toString() || '';
    const typeRank = item.type === 'directory' ? 0 : 1;
    const groupRank = this.getSpecialGroup(name, ctx);

    // 正文：尽量按章节/卷编号升序；缺失编号的放后面
    let numberRank = Number.POSITIVE_INFINITY;
    if (ctx === '正文') {
      const n = this.parseLeadingIndex(name);
      if (n !== null && n !== undefined) {
        numberRank = n;
      }
    }

    return { typeRank, groupRank, numberRank, name, originalIndex };
  }

  private sortChildren(items: NovelTreeItem[], dirPath?: string): NovelTreeItem[] {
    const createItems = items.filter(i => i.type === 'create-item');
    const normalItems = items.filter(i => i.type !== 'create-item');

    const ctx = dirPath ? this.getDirContext(dirPath) : 'default';

    const keyed = normalItems.map((item, idx) => ({ item, key: this.buildSortKey(item, ctx, idx) }));
    keyed.sort((a, b) => {
      if (a.key.typeRank !== b.key.typeRank) { return a.key.typeRank - b.key.typeRank; }
      if (a.key.groupRank !== b.key.groupRank) { return a.key.groupRank - b.key.groupRank; }
      if (a.key.numberRank !== b.key.numberRank) { return a.key.numberRank - b.key.numberRank; }

      const byName = this.compareByName(a.key.name, b.key.name);
      if (byName !== 0) { return byName; }
      return a.key.originalIndex - b.key.originalIndex;
    });

    return [...keyed.map(k => k.item), ...createItems];
  }

  private isTextFile(fileName: string): boolean {
    return TEXT_EXTS.some(ext => fileName.endsWith(ext));
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

  private isConfigFile(fileName: string): boolean {
    return fileName === CONFIG_FILE_NAME;
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