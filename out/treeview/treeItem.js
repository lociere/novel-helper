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
exports.NovelTreeItem = NovelTreeItem;
//# sourceMappingURL=treeItem.js.map