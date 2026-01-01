import * as vscode from 'vscode';
import * as path from 'path';

/** 树节点类型 */
export type NovelTreeNodeType = 
  | 'root' 
  | 'directory' 
  | 'file' 
  | 'create-item';

/** 小说树节点 */
export class NovelTreeItem extends vscode.TreeItem {
  public readonly type: NovelTreeNodeType;
  public readonly createType?: string;
  public readonly parentPath?: string;

  constructor(
    label: string,
    type: NovelTreeNodeType,
    collapsibleState: vscode.TreeItemCollapsibleState,
    resourceUri?: vscode.Uri,
    createType?: string,
    parentPath?: string
  ) {
    super(label, collapsibleState);
    this.type = type;
    this.createType = createType;
    this.parentPath = parentPath;

    // 设置图标和命令
    switch (type) {
      case 'root':
        this.iconPath = vscode.Uri.file(path.join(__dirname, '../../media/icons/novel-icon.svg'));
        break;
      case 'directory':
        this.iconPath = vscode.ThemeIcon.Folder;
        this.command = {
          command: 'vscode.openFolder',
          title: '打开目录',
          arguments: [resourceUri]
        };
        break;
      case 'file':
        this.iconPath = vscode.ThemeIcon.File;
        this.command = {
          command: 'vscode.open',
          title: '打开文件',
          arguments: [resourceUri]
        };
        break;
      case 'create-item':
        // 终极修复：使用VSCode所有版本都支持的内置图标（File），或自定义图标路径
        // 方案1：使用内置File图标（最兼容）
        this.iconPath = vscode.ThemeIcon.File;
        
        // 方案2（可选）：使用自定义加号图标（需在media/icons下添加add.svg）
        // this.iconPath = vscode.Uri.file(path.join(__dirname, '../../media/icons/add.svg'));
        
        this.command = {
          command: 'novel-helper.createItem',
          title: `创建${label.replace('新建', '')}`,
          arguments: [createType, parentPath]
        };
        this.tooltip = `创建${label.replace('新建', '')}`;
        break;
    }
  }
}