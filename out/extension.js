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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const commands_1 = require("./commands");
const treeView_1 = require("./treeView");
const statusBar_1 = require("./statusBar");
const panel_1 = require("./panel");
const highlighter_1 = require("./highlighter");
const stats_1 = require("./stats");
const formatter_1 = require("./formatter");
const config_1 = require("./utils/config");
/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
function activate(context) {
    console.log('novel-helper 已激活！');
    // 注册所有模块
    try {
        (0, commands_1.registerCommands)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerCommands 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册命令失败，请查看开发者控制台。');
    }
    try {
        (0, treeView_1.registerTreeView)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerTreeView 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册树视图失败，请查看开发者控制台。');
    }
    // 隐藏工作区内的插件配置文件，避免干扰资源管理器视图
    try {
        (0, config_1.hideConfigFileInExplorer)();
    }
    catch (e) {
        // 忽略
    }
    try {
        (0, statusBar_1.registerStatusBar)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerStatusBar 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册状态栏失败，请查看开发者控制台。');
    }
    try {
        (0, panel_1.registerPanel)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerPanel 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册面板失败，请查看开发者控制台。');
    }
    try {
        (0, highlighter_1.registerHighlighter)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerHighlighter 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册高亮失败，请查看开发者控制台。');
    }
    try {
        (0, stats_1.registerStats)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerStats 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册统计器失败，请查看开发者控制台。');
    }
    try {
        (0, formatter_1.registerFormatter)(context);
    }
    catch (e) {
        console.error('[Novel Helper] registerFormatter 失败：', e);
        vscode.window.showErrorMessage('Novel Helper: 注册格式化器失败，请查看开发者控制台。');
    }
}
/**
 * 扩展停用时执行
 */
function deactivate() {
    console.log('novel-helper 已停用！');
}
//# sourceMappingURL=extension.js.map