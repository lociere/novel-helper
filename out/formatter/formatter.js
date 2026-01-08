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
exports.Formatter = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("../utils/config");
/** 格式化管理器 */
class Formatter {
    constructor(context) {
        this.context = context;
        this.disposable = this.registerFormatter(); // 修改：接收返回的 disposable
        this.context.subscriptions.push(this.disposable);
    }
    /** 注册格式化程序 */
    registerFormatter() {
        // 注册文档格式化程序
        const formatterProvider = {
            provideDocumentFormattingEdits: (document) => {
                const config = (0, config_1.getVSCodeConfig)();
                const text = document.getText();
                // 1. 提取有效段落（处理掉所有原有空行和首尾空格）
                const paragraphs = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
                if (paragraphs.length === 0) {
                    // 如果全是空行，清空文档
                    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
                    return [vscode.TextEdit.replace(fullRange, '')];
                }
                // 2. 确定分隔符
                // config.lineSpacing 表示段落间的“空行数”
                // 0 => 换行 (\n)
                // 1 => 换行+空一行 (\n\n)
                const separator = '\n'.repeat(Math.max(1, config.lineSpacing + 1));
                const indentString = ' '.repeat(config.paragraphIndent);
                // 3. 重新组装文档
                const newText = paragraphs.map(p => indentString + p).join(separator);
                // 4. 全量替换（确保彻底符合格式）
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
                return [vscode.TextEdit.replace(fullRange, newText)];
            }
        };
        // 注册格式化程序并返回 disposable
        return vscode.languages.registerDocumentFormattingEditProvider([{ scheme: 'file', language: 'plaintext' }, { scheme: 'file', language: 'markdown' }], formatterProvider);
    }
    // 新增：实现 dispose 方法
    dispose() {
        this.disposable.dispose();
    }
}
exports.Formatter = Formatter;
//# sourceMappingURL=formatter.js.map