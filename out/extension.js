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
    // 注册功能模块的辅助函数
    const registerModule = (name, registerFn) => {
        try {
            registerFn(context);
        }
        catch (e) {
            console.error(`[Novel Helper] register${name} 失败：`, e);
            vscode.window.showErrorMessage(`Novel Helper: 注册${name}失败，请查看开发者控制台。`);
        }
    };
    // 按顺序注册各模块
    registerModule('Commands', commands_1.registerCommands);
    registerModule('TreeView', treeView_1.registerTreeView);
    registerModule('StatusBar', statusBar_1.registerStatusBar);
    registerModule('Panel', panel_1.registerPanel);
    registerModule('Highlighter', highlighter_1.registerHighlighter);
    registerModule('Stats', stats_1.registerStats);
    registerModule('Formatter', formatter_1.registerFormatter);
    // 隐藏工作区内的插件配置文件，避免干扰资源管理器视图
    try {
        (0, config_1.hideConfigFileInExplorer)();
    }
    catch (e) {
        // 忽略非关键错误
        console.warn('[Novel Helper] 隐藏配置文件失败:', e);
    }
}
/**
 * 扩展停用时执行
 */
function deactivate() {
    console.log('novel-helper 已停用！');
}
//# sourceMappingURL=extension.js.map