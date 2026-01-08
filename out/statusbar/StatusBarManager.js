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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("../utils/config");
const helpers_1 = require("../utils/helpers");
/** 状态栏管理器 */
class StatusBarManager {
    constructor(context) {
        this.context = context;
        this.statusBarItems = {};
        this.currentWordCount = 0;
        this.editStartTime = 0;
        /** 初始化状态栏项 */
        this.disposables = [];
        this.initStatusBarItems();
        this.startListening();
    }
    initStatusBarItems() {
        // 字数统计
        this.statusBarItems.wordCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItems.wordCount.command = 'novel-helper.openConfigPanel';
        this.statusBarItems.wordCount.tooltip = '点击打开配置面板';
        // 排版设置
        this.statusBarItems.format = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        this.statusBarItems.format.command = 'novel-helper.openConfigPanel';
        this.statusBarItems.format.tooltip = '点击打开配置面板';
        // 码字速度
        this.statusBarItems.speed = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
        this.statusBarItems.speed.command = 'novel-helper.openConfigPanel';
        this.statusBarItems.speed.tooltip = '点击打开配置面板';
        // 码字时间
        this.statusBarItems.time = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
        this.statusBarItems.time.command = 'novel-helper.openConfigPanel';
        this.statusBarItems.time.tooltip = '点击打开配置面板';
        // 注册到上下文
        Object.values(this.statusBarItems).forEach(item => {
            this.context.subscriptions.push(item);
        });
    }
    /** 开始监听文档变化 */
    startListening() {
        // 1. 文档切换：更新开始时间并刷新状态
        const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
            this.handleActiveEditorChange(editor);
        });
        // 2. 文档内容变化：更新实时统计
        const changeDocDisposable = vscode.workspace.onDidChangeTextDocument(event => {
            this.handleDocumentChange(event);
        });
        // 3. 文档关闭：累计编辑时长
        const closeDocDisposable = vscode.workspace.onDidCloseTextDocument(() => {
            this.handleDocumentClose();
        });
        // 统一管理资源
        const disposables = [activeEditorDisposable, changeDocDisposable, closeDocDisposable];
        this.context.subscriptions.push(...disposables);
        this.disposables.push(...disposables);
        // 4. 插件启动时的初始化检查
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.handleActiveEditorChange(activeEditor);
        }
    }
    /**
     * 处理编辑器激活/切换
     */
    handleActiveEditorChange(editor) {
        if (!editor) {
            return;
        }
        this.editStartTime = (0, helpers_1.getCurrentTimestamp)();
        const wordCount = (0, helpers_1.countWords)(editor.document.getText());
        // 更新会话开始状态，用于计算本次速度
        (0, config_1.writeConfig)({
            editStartTime: this.editStartTime,
            lastWordCount: wordCount
        });
        this.updateStatusBar(editor.document);
    }
    /**
     * 处理文档内容变更
     */
    handleDocumentChange(event) {
        const editor = vscode.window.activeTextEditor;
        // 仅当变更发生在当前激活的编辑器中才更新
        if (editor && event.document === editor.document) {
            this.updateStatusBar(event.document);
        }
    }
    /**
     * 处理文档关闭（计算时长）
     */
    handleDocumentClose() {
        const config = (0, config_1.readConfig)();
        const currentTime = (0, helpers_1.getCurrentTimestamp)();
        const duration = currentTime - config.editStartTime;
        (0, config_1.writeConfig)({ totalEditTime: config.totalEditTime + duration });
    }
    /** 更新状态栏 */
    updateStatusBar(document) {
        const config = (0, config_1.getVSCodeConfig)();
        const text = document.getText();
        this.currentWordCount = (0, helpers_1.countWords)(text);
        // 计算码字速度
        const currentTime = (0, helpers_1.getCurrentTimestamp)();
        const duration = currentTime - this.editStartTime; // 本次会话时长
        const wordChange = this.currentWordCount - config.lastWordCount; // 本次字数变化
        const speed = (0, helpers_1.calculateWritingSpeed)(wordChange, duration);
        this.updateStatusBarItem(this.statusBarItems.wordCount, `字数: ${this.currentWordCount}`);
        this.updateStatusBarItem(this.statusBarItems.format, `缩进: ${config.paragraphIndent} | 空行: ${config.lineSpacing}`);
        this.updateStatusBarItem(this.statusBarItems.speed, `速度: ${speed} 字/分钟`);
        this.updateStatusBarItem(this.statusBarItems.time, `时长: ${(0, helpers_1.formatTime)(config.totalEditTime + duration)}`);
        // 保存最新字数状态，供下次计算差值
        (0, config_1.writeConfig)({ lastWordCount: this.currentWordCount });
    }
    /**
     * 辅助方法：更新状态栏项显示
     */
    updateStatusBarItem(item, text) {
        item.text = text;
        item.show();
    }
    /** 销毁状态栏项 */
    dispose() {
        Object.values(this.statusBarItems).forEach(item => item.dispose());
        this.disposables.forEach(d => { try {
            d.dispose();
        }
        catch (e) { /* ignore */ } });
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBarManager.js.map