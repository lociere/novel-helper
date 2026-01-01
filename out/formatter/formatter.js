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
                const edits = [];
                const lines = document.getText().split('\n');
                let lastLineWasEmpty = false;
                lines.forEach((line, lineNumber) => {
                    const range = document.lineAt(lineNumber).range;
                    // 处理段首缩进
                    let formattedLine = line;
                    if (line.trim() !== '' && !lastLineWasEmpty) {
                        // 非空行且上一行不是空行，添加段首缩进
                        formattedLine = ' '.repeat(config.paragraphIndent) + line;
                    }
                    // 处理行间空行
                    if (line.trim() === '') {
                        lastLineWasEmpty = true;
                        // 只保留配置的空行数
                        if (config.lineSpacing === 0) {
                            edits.push(vscode.TextEdit.delete(range));
                            return;
                        }
                    }
                    else {
                        lastLineWasEmpty = false;
                    }
                    // 应用修改
                    if (formattedLine !== line) {
                        edits.push(vscode.TextEdit.replace(range, formattedLine));
                    }
                });
                return edits;
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