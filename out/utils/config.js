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
exports.hideConfigFileInExplorer = exports.getVSCodeConfig = exports.writeConfig = exports.readConfig = exports.getConfigFilePath = exports.CONFIG_FILE_NAME = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/** 默认配置 */
const defaultConfig = {
    workspacePath: '',
    paragraphIndent: 2,
    lineSpacing: 1,
    fontSize: 14,
    highlightColor: '#FFD700',
    highlightItems: {},
    editStartTime: 0,
    totalEditTime: 0,
    lastWordCount: 0
};
/** 配置文件名称 */
exports.CONFIG_FILE_NAME = '.novel-helper.json';
/**
 * 获取工作区配置文件路径
 * @returns 配置文件路径
 */
const getConfigFilePath = () => {
    if (!vscode.workspace.workspaceFolders) {
        return '';
    }
    return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, exports.CONFIG_FILE_NAME);
};
exports.getConfigFilePath = getConfigFilePath;
/**
 * 读取配置
 * @returns 配置对象
 */
const readConfig = () => {
    const configPath = (0, exports.getConfigFilePath)();
    if (!fs.existsSync(configPath)) {
        return { ...defaultConfig, workspacePath: vscode.workspace.workspaceFolders?.[0].uri.fsPath || '' };
    }
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(content) };
    }
    catch {
        vscode.window.showErrorMessage('读取配置文件失败，使用默认配置');
        return defaultConfig;
    }
};
exports.readConfig = readConfig;
/**
 * 写入配置
 * @param config 配置对象
 */
const writeConfig = (config) => {
    const configPath = (0, exports.getConfigFilePath)();
    if (!configPath) {
        vscode.window.showErrorMessage('未找到工作区');
        return;
    }
    const currentConfig = (0, exports.readConfig)();
    const newConfig = { ...currentConfig, ...config };
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    }
    catch {
        vscode.window.showErrorMessage('写入配置文件失败');
    }
};
exports.writeConfig = writeConfig;
/**
 * 获取VSCode内置配置
 * @returns 内置配置
 */
const getVSCodeConfig = () => {
    const config = vscode.workspace.getConfiguration('novel-helper');
    return {
        ...(0, exports.readConfig)(),
        paragraphIndent: config.get('paragraphIndent', 2),
        lineSpacing: config.get('lineSpacing', 1),
        fontSize: config.get('fontSize', 14),
        highlightColor: config.get('highlightColor', '#FFD700')
    };
};
exports.getVSCodeConfig = getVSCodeConfig;
/**
 * 在工作区设置中隐藏配置文件
 */
const hideConfigFileInExplorer = () => {
    try {
        const workspaceConfig = vscode.workspace.getConfiguration('files');
        const exclude = workspaceConfig.get('exclude') || {};
        let changed = false;
        if (!exclude[exports.CONFIG_FILE_NAME]) {
            exclude[exports.CONFIG_FILE_NAME] = true;
            changed = true;
        }
        // 隐藏 .vscode 文件夹（工作区设置）
        if (!exclude['.vscode']) {
            exclude['.vscode'] = true;
            changed = true;
        }
        // 额外添加通配，确保隐藏子项
        if (!exclude['.vscode/**']) {
            exclude['.vscode/**'] = true;
            changed = true;
        }
        if (changed) {
            workspaceConfig.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
        }
    }
    catch {
        // 忽略配置更新失败
    }
};
exports.hideConfigFileInExplorer = hideConfigFileInExplorer;
//# sourceMappingURL=config.js.map