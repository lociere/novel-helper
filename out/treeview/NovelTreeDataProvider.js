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
        // 根节点
        if (!element) {
            const roots = [
                // 大纲
                new treeItem_1.NovelTreeItem('大纲', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '大纲'))),
                // 设定
                new treeItem_1.NovelTreeItem('设定', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '设定'))),
                // 素材
                new treeItem_1.NovelTreeItem('素材', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '素材'))),
                // 正文
                new treeItem_1.NovelTreeItem('正文', 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(root, '正文')))
            ];
            return roots.filter(r => {
                const lbl = typeof r.label === 'string' ? r.label : r.label?.toString();
                return lbl !== config_1.CONFIG_FILE_NAME;
            });
        }
        // 目录节点
        if (element.type === 'directory') {
            // 有时 resourceUri 可能为 undefined（例如从其它地方构造的节点），对此做防护并回退到基于 label 的路径推断
            let dirPath;
            if (element.resourceUri && element.resourceUri.fsPath) {
                dirPath = element.resourceUri.fsPath;
            }
            else {
                const label = typeof element.label === 'string' ? element.label : element.label?.toString();
                if (!label)
                    return [];
                switch (label) {
                    case '大纲':
                        dirPath = path.join(root, '大纲');
                        break;
                    case '设定':
                        dirPath = path.join(root, '设定');
                        break;
                    case '素材':
                        dirPath = path.join(root, '素材');
                        break;
                    case '正文':
                        dirPath = path.join(root, '正文');
                        break;
                    default:
                        // 如果既没有 resourceUri 也无法推断路径，安全返回空
                        return [];
                }
            }
            const configFullPath = (0, config_1.getConfigFilePath)();
            const allFiles = (0, helpers_1.getDirFiles)(dirPath).filter(f => {
                try {
                    if (f === config_1.CONFIG_FILE_NAME)
                        return false;
                    const full = path.join(dirPath, f);
                    if (full === configFullPath)
                        return false;
                }
                catch (e) {
                    // ignore and keep file
                }
                return true;
            });
            const children = [];
            // 先添加子目录（例如正文下的分卷）
            allFiles.forEach((file) => {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    children.push(new treeItem_1.NovelTreeItem(file, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(filePath)));
                }
            });
            // 再添加文件
            allFiles.forEach((file) => {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (!stat.isDirectory()) {
                    children.push(new treeItem_1.NovelTreeItem(file, 'file', vscode.TreeItemCollapsibleState.None, vscode.Uri.file(filePath)));
                }
            });
            // 最后添加模块专属的“新建”按钮（放在最后）
            const base = path.basename(dirPath);
            switch (base) {
                case '大纲':
                    children.push(new treeItem_1.NovelTreeItem('新建总大纲', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '总大纲', dirPath));
                    children.push(new treeItem_1.NovelTreeItem('新建分大纲', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '分大纲', dirPath));
                    break;
                case '设定':
                    // 在设定模块下，优先显示子设定文件夹（例如：角色设定、事物设定）。
                    // 即使这些文件夹尚不存在，也在视图中显示对应的目录节点，用户可在其内创建具体设定文件。
                    const settingFolders = ['角色设定', '事物设定'];
                    for (const sf of settingFolders) {
                        const exists = children.some(c => typeof c.label === 'string' && c.label === sf && c.type === 'directory');
                        if (!exists) {
                            children.push(new treeItem_1.NovelTreeItem(sf, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(dirPath, sf))));
                        }
                    }
                    // 在设定模块根处提供创建子设定文件夹的入口
                    children.push(new treeItem_1.NovelTreeItem('新建设定文件夹', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '设定文件夹', dirPath));
                    break;
                case '素材':
                    // 在素材模块下，显示图片/文字素材子文件夹（即使尚不存在也显示为可展开目录）
                    const mediaFolders = ['图片素材', '文字素材'];
                    for (const mf of mediaFolders) {
                        const existsMf = children.some(c => typeof c.label === 'string' && c.label === mf && c.type === 'directory');
                        if (!existsMf) {
                            children.push(new treeItem_1.NovelTreeItem(mf, 'directory', vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(path.join(dirPath, mf))));
                        }
                    }
                    // 在素材模块根处提供创建子素材文件夹的入口
                    children.push(new treeItem_1.NovelTreeItem('新建素材文件夹', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '素材文件夹', dirPath));
                    break;
                case '正文':
                    // 正文根：先显示分卷/章节等，然后提供创建分卷与直接在正文根创建章节的入口
                    children.push(new treeItem_1.NovelTreeItem('新建分卷', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '分卷', dirPath));
                    children.push(new treeItem_1.NovelTreeItem('新建章节', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '章节', dirPath));
                    break;
                default:
                    // 如果当前目录是正文下的分卷，则在最后添加“新建章节”按钮
                    if (path.dirname(dirPath) === path.join(root, '正文')) {
                        children.push(new treeItem_1.NovelTreeItem('新建章节', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '章节', dirPath));
                    }
                    break;
            }
            // 如果当前目录是设定下的子文件夹，则在其内添加创建设定文件的入口
            if (base === '角色设定') {
                children.push(new treeItem_1.NovelTreeItem('新建角色设定', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '角色设定', dirPath));
            }
            if (base === '事物设定') {
                children.push(new treeItem_1.NovelTreeItem('新建事物设定', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '事物设定', dirPath));
            }
            // 素材子文件夹内的创建入口
            if (base === '图片素材') {
                children.push(new treeItem_1.NovelTreeItem('新建图片素材', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '图片素材', dirPath));
            }
            if (base === '文字素材') {
                children.push(new treeItem_1.NovelTreeItem('新建素材文件', 'create-item', vscode.TreeItemCollapsibleState.None, undefined, '文字素材', dirPath));
            }
            return children.filter(c => {
                const lbl = typeof c.label === 'string' ? c.label : c.label?.toString();
                return lbl !== config_1.CONFIG_FILE_NAME;
            });
        }
        // 其他节点无子女
        return [];
    }
}
exports.NovelTreeDataProvider = NovelTreeDataProvider;
//# sourceMappingURL=novelTreeDataProvider.js.map