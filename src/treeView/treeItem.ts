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
    // 将传入的 resourceUri 赋值到 TreeItem，以便数据提供器等可以读取
    if (resourceUri) {
      this.resourceUri = resourceUri;
    }
    this.type = type;
    this.createType = createType;
    this.parentPath = parentPath;

    // 用于 view/item/context 的 when 条件（右键菜单）。
    this.contextValue = type;

    // 设置图标和命令
    switch (type) {
      case 'root':
        this.iconPath = vscode.Uri.file(path.join(__dirname, '../../media/icons/novel-icon.svg'));
        break;
      case 'directory':
        this.iconPath = vscode.ThemeIcon.Folder;
        // 目录节点应作为可展开项处理，点击时不要触发打开新窗口的行为。
        // 不设置 command，这样 VS Code 会使用展开/折叠行为而非切换工作区。
        break;
      case 'file':
        this.iconPath = vscode.ThemeIcon.File;
        if (resourceUri) {
          this.command = {
            command: 'vscode.open',
            title: '打开文件',
            arguments: [resourceUri]
          };
        }
        break;
      case 'create-item':
        // 使用加号图标使“新建”节点更明显
        this.iconPath = new vscode.ThemeIcon('add');

        // 特殊处理：初始化工作区命令（无需输入名称）
        if (createType === 'init') {
          this.command = {
            command: 'novel-helper.initWorkspace',
            title: '开启小说工作区',
            arguments: []
          };
          this.tooltip = '开启小说工作区';
        } else {
          // 常规创建项
          this.command = {
            command: 'novel-helper.createItem',
            title: `创建${label.replace('新建', '')}`,
            arguments: [createType, parentPath]
          };
          this.tooltip = `创建${label.replace('新建', '')}`;
        }
        // 给创建项添加一个描述，便于用户识别
        this.description = '新建';
        break;
    }
  }
}