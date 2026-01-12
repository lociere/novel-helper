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
exports.registerTreeView = void 0;
const vscode = __importStar(require("vscode"));
const novelTreeDataProvider_1 = require("./novelTreeDataProvider");
// 超大文件字数统计保护阈值（字符数），超过则仅在保存时刷新
const LARGE_FILE_CHAR_THRESHOLD = 500000;
/**
 * 注册小说树视图
 * @param context 扩展上下文
 */
const registerTreeView = (context) => {
    const treeDataProvider = new novelTreeDataProvider_1.NovelTreeDataProvider();
    const treeView = vscode.window.createTreeView('novelTreeView', {
        treeDataProvider,
        showCollapseAll: true
    });
    // 注册刷新命令
    context.subscriptions.push(vscode.commands.registerCommand('novelTreeView.refresh', () => {
        treeDataProvider.refresh();
    }));
    context.subscriptions.push(treeView);
    // 监听文件保存（立即刷新）
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
        treeDataProvider.refresh();
    }));
    // 监听内容变化（防抖刷新，用于实时更新字数）
    let debounceTimer;
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        // 仅关注相关文本文件，且树视图可见时再刷新，降低不必要的开销
        if (!treeView.visible) {
            return;
        }
        if (e.document.uri.scheme === 'file' && (e.document.fileName.endsWith('.txt') || e.document.fileName.endsWith('.md'))) {
            const textLength = e.document.getText().length;
            // 超大文件：仅在保存时刷新，避免频繁遍历影响性能
            if (textLength > LARGE_FILE_CHAR_THRESHOLD) {
                return;
            }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                treeDataProvider.refresh();
            }, 500); // 缩短至 500ms，提升“几乎实时”的体验
        }
    }));
};
exports.registerTreeView = registerTreeView;
//# sourceMappingURL=index.js.map