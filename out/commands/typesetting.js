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
exports.applyIndentCommand = applyIndentCommand;
exports.unifyLineGapCommand = unifyLineGapCommand;
exports.registerAutoFormatOnSave = registerAutoFormatOnSave;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
/**
 * 应用段首缩进
 */
function applyIndentCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('小说助手：请先打开文本文件再应用缩进');
        return;
    }
    const config = extension_1.configManager.getConfig().typesetting;
    const indent = config.indentType === 'space'
        ? ' '.repeat(config.indentCount)
        : '\t';
    editor.edit(editBuilder => {
        // 处理选中区域或全文
        const ranges = editor.selections.length > 0 && !editor.selection.isEmpty
            ? editor.selections
            : [new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length))];
        ranges.forEach(range => {
            for (let line = range.start.line; line <= range.end.line; line++) {
                const lineText = editor.document.lineAt(line).text;
                // 跳过空行
                if (lineText.trim() === '')
                    continue;
                // 已缩进则跳过
                if (lineText.startsWith(indent))
                    continue;
                // 添加缩进
                editBuilder.replace(new vscode.Range(line, 0, line, 0), indent);
            }
        });
    }).then(success => {
        if (success) {
            vscode.window.showInformationMessage(`小说助手：已应用${config.indentCount}${config.indentType === 'space' ? '个空格' : '个制表符'}缩进`);
        }
    });
}
/**
 * 统一行间空行
 */
function unifyLineGapCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('小说助手：请先打开文本文件再统一空行');
        return;
    }
    const config = extension_1.configManager.getConfig().typesetting;
    const lineGap = config.lineGap;
    editor.edit(editBuilder => {
        const fullText = editor.document.getText();
        // 分割并过滤空行
        const lines = fullText.split(/\r?\n/).filter(line => line.trim() !== '');
        // 重新拼接（添加指定空行数）
        const newText = lines.join('\n'.repeat(lineGap + 1));
        const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(fullText.length));
        editBuilder.replace(fullRange, newText);
    }).then(success => {
        if (success) {
            vscode.window.showInformationMessage(`小说助手：已统一设置为${lineGap}行空行`);
        }
    });
}
/**
 * 注册保存时自动排版
 */
function registerAutoFormatOnSave() {
    vscode.workspace.onWillSaveTextDocument(event => {
        const config = extension_1.configManager.getConfig();
        // 仅在工作区已初始化且开启自动排版时生效
        if (!config.workspaceInitialized || !config.typesetting.autoFormatOnSave)
            return;
        // 仅处理正文TXT文件
        if (event.document.languageId !== 'plaintext' || !event.document.uri.fsPath.includes('正文'))
            return;
        // 执行自动排版（返回空数组匹配类型要求）
        event.waitUntil(new Promise(resolve => {
            applyIndentCommand();
            unifyLineGapCommand();
            resolve([]);
        }));
    });
}
//# sourceMappingURL=typesetting.js.map