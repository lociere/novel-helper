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
        // 文档打开时初始化
        const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.editStartTime = (0, helpers_1.getCurrentTimestamp)();
                const config = (0, config_1.readConfig)();
                (0, config_1.writeConfig)({ editStartTime: this.editStartTime, lastWordCount: (0, helpers_1.countWords)(editor.document.getText()) });
                this.updateStatusBar(editor.document);
            }
        });
        // 文档内容变化时更新
        const changeDocDisposable = vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                this.updateStatusBar(event.document);
            }
        });
        // 文档关闭时更新累计时间
        const closeDocDisposable = vscode.workspace.onDidCloseTextDocument(document => {
            const config = (0, config_1.readConfig)();
            const currentTime = (0, helpers_1.getCurrentTimestamp)();
            const duration = currentTime - config.editStartTime;
            (0, config_1.writeConfig)({ totalEditTime: config.totalEditTime + duration });
        });
        // 统一管理 disposables
        this.context.subscriptions.push(activeEditorDisposable, changeDocDisposable, closeDocDisposable);
        this.disposables.push(activeEditorDisposable, changeDocDisposable, closeDocDisposable);
    }
    /** 更新状态栏 */
    updateStatusBar(document) {
        const config = (0, config_1.getVSCodeConfig)();
        const text = document.getText();
        this.currentWordCount = (0, helpers_1.countWords)(text);
        // 计算码字速度
        const currentTime = (0, helpers_1.getCurrentTimestamp)();
        const duration = currentTime - this.editStartTime;
        const wordChange = this.currentWordCount - config.lastWordCount;
        const speed = (0, helpers_1.calculateWritingSpeed)(wordChange, duration);
        // 更新字数
        this.statusBarItems.wordCount.text = `字数: ${this.currentWordCount}`;
        this.statusBarItems.wordCount.show();
        // 更新排版设置
        this.statusBarItems.format.text = `缩进: ${config.paragraphIndent} | 空行: ${config.lineSpacing}`;
        this.statusBarItems.format.show();
        // 更新码字速度
        this.statusBarItems.speed.text = `速度: ${speed} 字/分钟`;
        this.statusBarItems.speed.show();
        // 更新码字时间
        const totalTime = config.totalEditTime + duration;
        this.statusBarItems.time.text = `耗时: ${(0, helpers_1.formatTime)(totalTime)}`;
        this.statusBarItems.time.show();
        // 保存最新字数
        (0, config_1.writeConfig)({ lastWordCount: this.currentWordCount });
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