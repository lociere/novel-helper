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
exports.getDirFiles = exports.writeFile = exports.readFile = exports.createFile = exports.createDir = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 创建目录（优化版：增加错误处理+返回执行结果）
 * @param dirPath 目录路径
 * @returns 创建是否成功
 */
const createDir = (dirPath) => {
    // 参数有效性检查
    if (!dirPath || typeof dirPath !== 'string') {
        vscode.window.showErrorMessage('目录路径不能为空且必须为字符串！');
        return false;
    }
    try {
        // 检查目录是否已存在
        if (!fs.existsSync(dirPath)) {
            // 递归创建目录
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    }
    catch (error) {
        // 捕获并显示错误信息
        const errMsg = error.message;
        vscode.window.showErrorMessage(`创建目录失败：${errMsg}`);
        console.error('[Novel Helper] 创建目录错误:', error);
        return false;
    }
};
exports.createDir = createDir;
/**
 * 创建文件（优化版：错误处理+父目录检查+返回执行结果）
 * @param filePath 文件路径
 * @param content 文件内容
 * @returns 创建是否成功
 */
const createFile = (filePath, content = '') => {
    // 参数有效性检查
    if (!filePath || typeof filePath !== 'string') {
        vscode.window.showErrorMessage('文件路径不能为空且必须为字符串！');
        return false;
    }
    try {
        // 检查文件是否已存在
        if (fs.existsSync(filePath)) {
            const fileName = path.basename(filePath);
            vscode.window.showWarningMessage(`文件已存在：${fileName}`);
            return false;
        }
        // 确保父目录存在
        const parentDir = path.dirname(filePath);
        (0, exports.createDir)(parentDir);
        // 写入文件内容
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    }
    catch (error) {
        const errMsg = error.message;
        vscode.window.showErrorMessage(`创建文件失败：${errMsg}`);
        console.error('[Novel Helper] 创建文件错误:', error);
        return false;
    }
};
exports.createFile = createFile;
/**
 * 读取文件内容（优化版：增加错误处理）
 * @param filePath 文件路径
 * @returns 文件内容（读取失败返回空字符串）
 */
const readFile = (filePath) => {
    if (!filePath || !fs.existsSync(filePath)) {
        return '';
    }
    try {
        return fs.readFileSync(filePath, 'utf-8');
    }
    catch (error) {
        const errMsg = error.message;
        vscode.window.showErrorMessage(`读取文件失败：${errMsg}`);
        console.error('[Novel Helper] 读取文件错误:', error);
        return '';
    }
};
exports.readFile = readFile;
/**
 * 写入文件内容（优化版：增加错误处理+友好提示）
 * @param filePath 文件路径
 * @param content 要写入的内容
 */
const writeFile = (filePath, content) => {
    if (!filePath || typeof filePath !== 'string') {
        vscode.window.showErrorMessage('文件路径不能为空且必须为字符串！');
        return;
    }
    try {
        // 确保父目录存在
        const parentDir = path.dirname(filePath);
        (0, exports.createDir)(parentDir);
        // 写入文件
        fs.writeFileSync(filePath, content, 'utf-8');
        // 友好提示
        const fileName = path.basename(filePath);
        vscode.window.showInformationMessage(`文件保存成功：${fileName}`);
    }
    catch (error) {
        const errMsg = error.message;
        vscode.window.showErrorMessage(`文件保存失败：${errMsg}`);
        console.error('[Novel Helper] 写入文件错误:', error);
    }
};
exports.writeFile = writeFile;
/**
 * 读取目录下的文件列表
 * @param dirPath 目录路径
 * @returns 文件名称数组
 */
const getDirFiles = (dirPath) => {
    if (!dirPath || !fs.existsSync(dirPath)) {
        return [];
    }
    try {
        return fs.readdirSync(dirPath);
    }
    catch (error) {
        console.error('[Novel Helper] 读取目录失败:', error);
        vscode.window.showErrorMessage(`读取目录失败：${error.message}`);
        return [];
    }
};
exports.getDirFiles = getDirFiles;
//# sourceMappingURL=fileSystem.js.map