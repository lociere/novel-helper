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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    workspaceInitialized: false,
    typesetting: {
        indentType: 'space',
        indentCount: 2,
        lineGap: 1,
        autoFormatOnSave: true
    },
    highlight: {
        character: [],
        thing: [],
        colors: {
            character: '#e6f7ff',
            thing: '#f0fff4'
        }
    },
    stats: {
        totalWordCount: 0,
        currentFileWordCount: 0,
        totalWritingTime: 0,
        speedWindow: 10,
        countSpace: false
    }
};
/**
 * 配置管理器
 */
class ConfigManager {
    configPath = '';
    config;
    constructor() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            this.configPath = path.join(workspaceRoot, '.novel-helper.json');
        }
        this.config = this.loadConfig();
    }
    /**
     * 加载配置文件
     */
    loadConfig() {
        if (!this.configPath || !fs.existsSync(this.configPath)) {
            return { ...DEFAULT_CONFIG };
        }
        try {
            const content = fs.readFileSync(this.configPath, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
        }
        catch (error) {
            vscode.window.showErrorMessage('小说助手：配置文件损坏，将使用默认配置');
            return { ...DEFAULT_CONFIG };
        }
    }
    /**
     * 保存配置文件
     */
    saveConfig() {
        if (!this.configPath) {
            vscode.window.showErrorMessage('小说助手：未打开工作区，无法保存配置');
            return;
        }
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            this.hideConfigFile();
        }
        catch (error) {
            vscode.window.showErrorMessage('小说助手：保存配置失败，请检查文件权限');
        }
    }
    /**
     * 隐藏配置文件（不在资源管理器显示）
     */
    hideConfigFile() {
        const workspaceConfig = vscode.workspace.getConfiguration('files');
        const exclude = workspaceConfig.get('exclude') || {};
        if (!exclude['.novel-helper.json']) {
            exclude['.novel-helper.json'] = true;
            workspaceConfig.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
        }
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 更新配置
     * @param update 配置更新项
     */
    updateConfig(update) {
        this.config = { ...this.config, ...update };
        this.saveConfig();
    }
    /**
     * 更新排版配置
     * @param update 排版配置更新项
     */
    updateTypesetting(update) {
        this.config.typesetting = { ...this.config.typesetting, ...update };
        this.saveConfig();
    }
    /**
     * 更新高亮配置
     * @param update 高亮配置更新项
     */
    updateHighlight(update) {
        this.config.highlight = { ...this.config.highlight, ...update };
        this.saveConfig();
    }
    /**
     * 更新统计配置
     * @param update 统计配置更新项
     */
    updateStats(update) {
        this.config.stats = { ...this.config.stats, ...update };
        this.saveConfig();
    }
    /**
     * 初始化工作区
     */
    async initWorkspace() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('小说助手：请先打开一个文件夹作为工作区');
            return false;
        }
        // 创建核心目录
        const dirs = [
            path.join(workspaceRoot, '正文'),
            path.join(workspaceRoot, '大纲'),
            path.join(workspaceRoot, '设定'),
            path.join(workspaceRoot, '素材')
        ];
        try {
            for (const dir of dirs) {
                await fs.ensureDir(dir);
            }
            // 更新配置
            this.config.workspaceInitialized = true;
            this.saveConfig();
            return true;
        }
        catch (error) {
            vscode.window.showErrorMessage(`小说助手：初始化工作区失败 - ${error.message}`);
            return false;
        }
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map