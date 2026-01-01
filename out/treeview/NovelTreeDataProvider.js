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
exports.NovelTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const treeItem_1 = require("./treeItem");
const fileSystem_1 = require("../utils/fileSystem");
/** 小说树数据提供器 */
class NovelTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    /** 刷新树视图 */
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    /** 获取树节点 */
    getTreeItem(element) {
        return element;
    }
    /** 获取子节点 */
    getChildren(element) {
        // 非小说工作区，提示初始化
        if (!(0, fileSystem_1.isNovelWorkspace)()) {
            return [
                new treeItem_1.NovelTreeItem('未初始化小说工作区，点击初始化', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, 'init', undefined)
            ];
        }
        const root = (0, fileSystem_1.getWorkspaceRoot)();
        // 根节点
        if (!element) {
            return [
                // 大纲
                new treeItem_1.NovelTreeItem('大纲', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '大纲'))),
                // 设定
                new treeItem_1.NovelTreeItem('设定', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '设定'))),
                // 素材
                new treeItem_1.NovelTreeItem('素材', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '素材'))),
                // 正文
                new treeItem_1.NovelTreeItem('正文', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '正文')))
            ];
        }
        // 目录节点
        if (element.type === 'directory') {
            const dirPath = element.resourceUri.fsPath;
            const files = (0, fileSystem_1.getDirFiles)(dirPath);
            const children = [];
            // 添加新建节点
            switch (path.basename(dirPath)) {
                case '大纲':
                    children.push(new treeItem_1.NovelTreeItem('新建总大纲', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '总大纲', root));
                    children.push(new treeItem_1.NovelTreeItem('新建分大纲', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '分大纲', root));
                    break;
                case '角色设定':
                    children.push(new treeItem_1.NovelTreeItem('新建角色设定', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '角色设定', path.dirname(dirPath)));
                    break;
                case '事物设定':
                    children.push(new treeItem_1.NovelTreeItem('新建事物设定', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '事物设定', path.dirname(dirPath)));
                    break;
                case '图片素材':
                    children.push(new treeItem_1.NovelTreeItem('新建图片素材文件夹', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '图片素材', path.dirname(dirPath)));
                    break;
                case '文字素材':
                    children.push(new treeItem_1.NovelTreeItem('新建文字素材', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '文字素材', path.dirname(dirPath)));
                    break;
                case '正文':
                    children.push(new treeItem_1.NovelTreeItem('新建分卷', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '分卷', root));
                    break;
                default:
                    // 分卷目录，添加新建章节
                    if (path.dirname(dirPath) === path.join(root, '正文')) {
                        children.push(new treeItem_1.NovelTreeItem('新建章节', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '章节', dirPath));
                    }
                    break;
            }
            // 添加文件/子目录
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    children.push(new treeItem_1.NovelTreeItem(file, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(filePath)));
                }
                else {
                    children.push(new treeItem_1.NovelTreeItem(file, 'file', vscode.TreeItemCollapsibleState.None, vscode.Uri.file(filePath)));
                }
            });
            return children;
        }
        // 其他节点无子女
        return [];
    }
}
exports.NovelTreeDataProvider = NovelTreeDataProvider;
//# sourceMappingURL=novelTreeDataProvider.js.map