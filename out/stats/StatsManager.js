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
exports.StatsManager = void 0;
const vscode = __importStar(require("vscode"));
const helpers_1 = require("../utils/helpers");
const config_1 = require("../utils/config");
/** 统计管理器 */
class StatsManager {
    constructor(context) {
        this.context = context;
        this.totalWordCount = 0;
        this.totalEditTime = 0;
        this.loadStats();
        this.statsCommandDisposable = this.startListening(); // 修改：接收返回的 disposable
        this.context.subscriptions.push(this.statsCommandDisposable);
    }
    /** 加载统计数据 */
    loadStats() {
        const config = (0, config_1.readConfig)();
        this.totalEditTime = config.totalEditTime || 0;
    }
    /** 开始监听 */
    startListening() {
        // 文档保存时更新总字数
        const saveDisposable = vscode.workspace.onDidSaveTextDocument(document => {
            const wordCount = (0, helpers_1.countWords)(document.getText());
            this.totalWordCount = wordCount;
            vscode.window.setStatusBarMessage(`已保存，当前总字数: ${this.totalWordCount}`, 3000);
        });
        // 显示统计信息命令
        const cmdDisposable = vscode.commands.registerCommand('novel-helper.showStats', () => {
            const config = (0, config_1.readConfig)();
            const currentTime = (0, helpers_1.getCurrentTimestamp)();
            const duration = currentTime - config.editStartTime;
            const speed = (0, helpers_1.calculateWritingSpeed)(this.totalWordCount, config.totalEditTime + duration);
            const statsMessage = `
📊 小说创作统计：
总字数：${this.totalWordCount}
总耗时：${(0, helpers_1.formatTime)(config.totalEditTime)}
平均速度：${speed} 字/分钟
      `;
            vscode.window.showInformationMessage(statsMessage);
        });
        return vscode.Disposable.from(saveDisposable, cmdDisposable);
    }
    /** 获取总字数 */
    getTotalWordCount() {
        return this.totalWordCount;
    }
    /** 获取总耗时 */
    getTotalEditTime() {
        return this.totalEditTime;
    }
    // 新增：实现 dispose 方法
    dispose() {
        this.statsCommandDisposable.dispose();
    }
}
exports.StatsManager = StatsManager;
//# sourceMappingURL=statsManager.js.map