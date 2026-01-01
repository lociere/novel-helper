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
exports.addHighlightCommand = addHighlightCommand;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
/**
 * 添加高亮项命令
 */
async function addHighlightCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('小说助手：请先选中要添加高亮的文本');
        return;
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('小说助手：请选中要添加高亮的文本');
        return;
    }
    // 获取选中的文本
    const selectedText = editor.document.getText(selection).trim();
    if (!selectedText) {
        vscode.window.showErrorMessage('小说助手：选中的文本不能为空');
        return;
    }
    // 选择高亮类型
    const highlightType = await vscode.window.showQuickPick(['角色名', '事物设定'], { placeHolder: '请选择高亮类型' });
    if (!highlightType)
        return;
    // 获取当前文件路径和行号
    const sourcePath = editor.document.uri.fsPath;
    const line = selection.start.line + 1; // 行号从1开始
    // 更新配置
    const config = extension_1.configManager.getConfig();
    const highlightConfig = config.highlight;
    if (highlightType === '角色名') {
        highlightConfig.character.push({
            text: selectedText,
            sourcePath,
            line
        });
    }
    else {
        highlightConfig.thing.push({
            text: selectedText,
            sourcePath,
            line
        });
    }
    extension_1.configManager.updateHighlight(highlightConfig);
    vscode.window.showInformationMessage(`小说助手：已添加「${selectedText}」为${highlightType}高亮`);
}
//# sourceMappingURL=highlight.js.map