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
exports.registerCommands = void 0;
const vscode = __importStar(require("vscode"));
const initWorkspace_1 = require("./initWorkspace");
const createItems_1 = require("./createItems");
/**
 * 将命令执行包装，自动捕获同步或异步错误并显示友好提示
 */
function safeExec(fn) {
    return (...args) => {
        try {
            const res = fn(...args);
            // 处理异步函数的抛错
            if (res && typeof res.then === 'function') {
                return res.catch((err) => {
                    console.error('[Novel Helper] 命令执行失败（异步）:', err);
                    vscode.window.showErrorMessage(`命令执行失败：${(err && err.message) ? err.message : String(err)}`);
                });
            }
            return res;
        }
        catch (err) {
            console.error('[Novel Helper] 命令执行失败（同步）:', err);
            vscode.window.showErrorMessage(`命令执行失败：${(err && err.message) ? err.message : String(err)}`);
        }
    };
}
/**
 * 注册所有命令
 * @param context 扩展上下文
 */
const registerCommands = (context) => {
    // 初始化工作区
    const initWorkspaceCmd = vscode.commands.registerCommand('novel-helper.initWorkspace', safeExec(initWorkspace_1.initWorkspace));
    context.subscriptions.push(initWorkspaceCmd);
    // 创建小说项
    const createItemCmd = vscode.commands.registerCommand('novel-helper.createItem', safeExec((type, parentPath) => {
        (0, createItems_1.createItem)(type, parentPath);
    }));
    context.subscriptions.push(createItemCmd);
    // 格式化文档
    const formatDocumentCmd = vscode.commands.registerCommand('novel-helper.formatDocument', safeExec(async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('未打开编辑器');
            return;
        }
        await vscode.commands.executeCommand('editor.action.formatDocument');
    }));
    context.subscriptions.push(formatDocumentCmd);
    // 打开配置面板（命令入口）
    const openConfigPanelCmd = vscode.commands.registerCommand('novel-helper.openConfigPanel', safeExec(() => {
        vscode.commands.executeCommand('novel-helper.showConfigPanel');
    }));
    context.subscriptions.push(openConfigPanelCmd);
};
exports.registerCommands = registerCommands;
//# sourceMappingURL=index.js.map