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
exports.isNovelWorkspace = exports.getDirFiles = exports.calculateWritingSpeed = exports.formatTime = exports.getCurrentTimestamp = exports.getWorkspaceRoot = exports.countWords = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const config_1 = require("./config");
/**
 * 统计文本字数（优化版：适配中文小说计数规则）
 * 规则：中文字符算1个，英文单词算1个，数字算1个
 * @param text 待统计的文本
 * @returns 精准计数字数
 */
const countWords = (text) => {
    // 增加类型校验：非字符串直接返回0
    if (!text || typeof text !== 'string') {
        return 0;
    }
    let totalCount = 0;
    // 1. 匹配中文字符（[\u4e00-\u9fa5] 覆盖常用中文）
    const chineseCharMatches = text.match(/[\u4e00-\u9fa5]/g);
    if (chineseCharMatches) {
        totalCount += chineseCharMatches.length;
    }
    // 2. 匹配英文单词（至少1个字母，后跟可选字母/数字/下划线）
    const englishWordMatches = text.match(/[a-zA-Z]+[a-zA-Z0-9_]*/g);
    if (englishWordMatches) {
        totalCount += englishWordMatches.length;
    }
    // 3. 匹配独立数字（按完整数字串算1个，如"123"算1个）
    const numberMatches = text.match(/\b\d+\b/g);
    if (numberMatches) {
        totalCount += numberMatches.length;
    }
    return totalCount;
};
exports.countWords = countWords;
/**
 * 获取工作区根路径（兼容多工作区）
 * @returns 根路径字符串 | undefined
 */
const getWorkspaceRoot = () => {
    // 优先使用 config 中保存的 workspacePath（初始化后会写入），否则回退到当前打开的第一个工作区
    try {
        const cfg = (0, config_1.readConfig)();
        if (cfg && cfg.workspacePath && fs.existsSync(cfg.workspacePath)) {
            return cfg.workspacePath;
        }
    }
    catch (e) {
        // 忽略读取配置失败，回退到 workspaceFolders
    }
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return undefined;
    }
    return folders[0].uri.fsPath;
};
exports.getWorkspaceRoot = getWorkspaceRoot;
/**
 * 获取当前时间戳（毫秒）
 */
const getCurrentTimestamp = () => Date.now();
exports.getCurrentTimestamp = getCurrentTimestamp;
/**
 * 将毫秒格式化为易读字符串（例如：1天 2小时 3分钟）
 */
const formatTime = (ms) => {
    if (!ms || ms <= 0) {
        return '0秒';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days) {
        parts.push(`${days}天`);
    }
    if (hours) {
        parts.push(`${hours}小时`);
    }
    if (minutes) {
        parts.push(`${minutes}分钟`);
    }
    if (seconds) {
        parts.push(`${seconds}秒`);
    }
    return parts.join(' ');
};
exports.formatTime = formatTime;
/**
 * 计算写作速度（字/分钟），输入时间为毫秒
 */
const calculateWritingSpeed = (words, ms) => {
    if (!ms || ms <= 0) {
        return 0;
    }
    const minutes = ms / 60000;
    if (minutes <= 0) {
        return 0;
    }
    return Math.round(words / minutes);
};
exports.calculateWritingSpeed = calculateWritingSpeed;
/**
 * 读取目录下的文件列表（优化：增加错误捕获）
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
/**
 * 判断当前工作区是否为已初始化的小说工作区（存在关键目录）
 */
const isNovelWorkspace = () => {
    // 优先检查配置文件中保存的 workspacePath，兼容用户在初始化时指定的目录
    try {
        const cfg = (0, config_1.readConfig)();
        const cfgRoot = cfg && cfg.workspacePath && fs.existsSync(cfg.workspacePath) ? cfg.workspacePath : undefined;
        const root = cfgRoot || (0, exports.getWorkspaceRoot)();
        if (!root)
            return false;
        const requiredDirs = ['大纲', '设定', '素材', '正文'];
        return requiredDirs.every(d => fs.existsSync(path.join(root, d)));
    }
    catch (e) {
        // 若读取配置失败，则退化到基于工作区的判断
        const root = (0, exports.getWorkspaceRoot)();
        if (!root)
            return false;
        const requiredDirs = ['大纲', '设定', '素材', '正文'];
        return requiredDirs.every(d => fs.existsSync(path.join(root, d)));
    }
};
exports.isNovelWorkspace = isNovelWorkspace;
//# sourceMappingURL=helpers.js.map