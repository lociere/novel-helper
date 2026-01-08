"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovelTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/** 小说树节点 */
class NovelTreeItem extends vscode.TreeItem {
    constructor(label, type, collapsibleState, resourceUri, createType, parentPath) {
        super(label, collapsibleState);
        // 将传入的 resourceUri 赋值到 TreeItem，以便数据提供器等可以读取
        if (resourceUri) {
            this.resourceUri = resourceUri;
        }
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
                // 目录节点应作为可展开项处理，点击时不要触发打开新窗口的行为。
                // 不设置 command，这样 VS Code 会使用展开/折叠行为而非切换工作区。
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
                // 使用加号图标使“新建”节点更明显
                try {
                    this.iconPath = new vscode.ThemeIcon('add');
                }
                catch (e) {
                    this.iconPath = vscode.ThemeIcon.File;
                }
                // 特殊处理：初始化工作区命令（无需输入名称）
                if (createType === 'init') {
                    this.command = {
                        command: 'novel-helper.initWorkspace',
                        title: '初始化小说工作区',
                        arguments: []
                    };
                    this.tooltip = '初始化小说工作区';
                }
                else {
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
exports.NovelTreeItem = NovelTreeItem;
//# sourceMappingURL=treeItem.js.map