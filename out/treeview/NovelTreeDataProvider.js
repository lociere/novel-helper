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
const helpers_1 = require("../utils/helpers");
const fileSystem_1 = require("../utils/fileSystem");
const config_1 = require("../utils/config");
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
        if (!(0, helpers_1.isNovelWorkspace)()) {
            return [
                new treeItem_1.NovelTreeItem('未初始化小说工作区，点击初始化', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, 'init', undefined)
            ];
        }
        const root = (0, helpers_1.getWorkspaceRoot)();
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
            // 过滤掉配置文件
            return children.filter(c => {
                const lbl = typeof c.label === 'string' ? c.label : c.label?.toString();
                return lbl !== config_1.CONFIG_FILE_NAME;
            });
        }
        return [];
    }
    /**
     * 获取根节点列表
     */
    getRootNodes(root) {
        const predefinedFolders = ['大纲', '设定', '素材', '正文'];
        const roots = predefinedFolders.map(folder => new treeItem_1.NovelTreeItem(folder, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, folder))));
        return roots;
    }
    /**
     * 解析目录路径
     */
    resolveDirPath(element, root) {
        if (element.resourceUri?.fsPath) {
            return element.resourceUri.fsPath;
        }
        // 兼容性处理：如果 resourceUri 丢失，尝试从 label 推断
        const label = typeof element.label === 'string' ? element.label : element.label?.toString();
        if (!label) {
            return undefined;
        }
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
    getDirectoryContent(dirPath) {
        const configFullPath = (0, config_1.getConfigFilePath)();
        let allFiles = [];
        try {
            allFiles = (0, fileSystem_1.getDirFiles)(dirPath);
        }
        catch (e) {
            return [];
        }
        const children = [];
        // 过滤并分类
        const folders = [];
        const files = [];
        allFiles.forEach(f => {
            // 忽略配置文件
            if (f === config_1.CONFIG_FILE_NAME) {
                return;
            }
            const full = path.join(dirPath, f);
            if (full === configFullPath) {
                return;
            }
            try {
                const stat = fs.statSync(full);
                if (stat.isDirectory()) {
                    folders.push(f);
                }
                else {
                    files.push(f);
                }
            }
            catch (e) {
                // ignore
            }
        });
        // 添加文件夹节点
        folders.forEach(f => {
            children.push(new treeItem_1.NovelTreeItem(f, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(dirPath, f))));
        });
        // 添加文件节点
        files.forEach(f => {
            const filePath = path.join(dirPath, f);
            const item = new treeItem_1.NovelTreeItem(f, 'file', vscode.TreeItemCollapsibleState.None, vscode.Uri.file(filePath));
            // 计算并显示文本文件的字数
            if (f.endsWith('.txt') || f.endsWith('.md')) {
                try {
                    // 优先读取已打开的文档内容（包含未保存变更），否则读取磁盘文件
                    const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
                    const content = openDoc ? openDoc.getText() : fs.readFileSync(filePath, 'utf-8');
                    const count = (0, helpers_1.countWords)(content);
                    item.description = `${count}字`;
                }
                catch (e) {
                    // ignore
                }
            }
            children.push(item);
        });
        return children;
    }
    /**
     * 根据上下文追加“新建”按钮或虚拟目录
     */
    appendCreateButtons(children, dirPath, root) {
        const base = path.basename(dirPath);
        const parent = path.dirname(dirPath);
        const isRootFolder = (name) => base === name && parent === root;
        // 辅助函数：快速创建按钮
        const addBtn = (label, contextVal) => {
            children.push(new treeItem_1.NovelTreeItem(label, 'create-item', vscode.TreeItemCollapsibleState.None, undefined, contextVal, dirPath));
        };
        // 辅助函数：确保虚拟目录存在
        const ensureVirtualDir = (folderName) => {
            const exists = children.some(c => typeof c.label === 'string' && c.label === folderName && c.type === 'directory');
            if (!exists) {
                children.push(new treeItem_1.NovelTreeItem(folderName, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(dirPath, folderName))));
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
        else if (base === '角色设定') {
            addBtn('新建角色设定', '角色设定');
        }
        else if (base === '事物设定') {
            addBtn('新建事物设定', '事物设定');
        }
        else if (base === '图片素材') {
            addBtn('新建图片素材', '图片素材');
        }
        else if (base === '文字素材') {
            addBtn('新建素材文件', '文字素材');
        }
    }
}
exports.NovelTreeDataProvider = NovelTreeDataProvider;
//# sourceMappingURL=novelTreeDataProvider.js.map