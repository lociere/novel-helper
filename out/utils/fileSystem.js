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
exports.getDirFiles = exports.isNovelWorkspace = exports.getWorkspaceRoot = exports.createFile = exports.createDir = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 创建目录（递归）
 * @param dirPath 目录路径
 */
const createDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
exports.createDir = createDir;
/**
 * 创建文件
 * @param filePath 文件路径
 * @param content 文件内容
 */
const createFile = (filePath, content = '') => {
    if (fs.existsSync(filePath)) {
        vscode.window.showWarningMessage(`文件已存在：${filePath}`);
        return;
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    vscode.window.showInformationMessage(`创建文件成功：${path.basename(filePath)}`);
};
exports.createFile = createFile;
/**
 * 获取工作区根路径
 * @returns 根路径
 */
const getWorkspaceRoot = () => {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath;
};
exports.getWorkspaceRoot = getWorkspaceRoot;
/**
 * 检查是否是小说工作区
 * @returns 是否是小说工作区
 */
const isNovelWorkspace = () => {
    const root = (0, exports.getWorkspaceRoot)();
    if (!root) {
        return false;
    }
    return fs.existsSync(path.join(root, '.novel-helper.json'));
};
exports.isNovelWorkspace = isNovelWorkspace;
/**
 * 获取目录下的文件列表（排除配置文件）
 * @param dirPath 目录路径
 * @returns 文件列表
 */
const getDirFiles = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs.readdirSync(dirPath).filter(file => {
        return file !== '.novel-helper.json' && !file.startsWith('.');
    });
};
exports.getDirFiles = getDirFiles;
//# sourceMappingURL=fileSystem.js.map