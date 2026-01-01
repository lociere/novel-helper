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
exports.Highlighter = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("../utils/config");
const helpers_1 = require("../utils/helpers");
/** 高亮管理器 */
class Highlighter {
    constructor(context) {
        this.context = context;
        this.decorations = {};
        this.highlightItems = {};
        // 初始化空的Disposable（兼容所有VSCode版本）
        this.clickDisposable = new vscode.Disposable(() => { });
        this.initDecorations();
        this.startListening();
    }
    /** 初始化装饰器 */
    initDecorations() {
        const config = (0, config_1.getVSCodeConfig)();
        this.decorations.highlight = vscode.window.createTextEditorDecorationType({
            backgroundColor: config.highlightColor,
            color: config.highlightTextColor,
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '2px'
        });
        this.context.subscriptions.push(this.decorations.highlight);
    }
    /** 开始监听 */
    startListening() {
        // 监听选中文本，添加高亮项
        vscode.window.onDidChangeTextEditorSelection(async (event) => {
            const editor = event.textEditor;
            const selection = event.selections[0];
            if (!selection.isEmpty) {
                const text = (0, helpers_1.getSelectedText)();
                if (text && editor.document.uri.fsPath.includes('设定')) {
                    // 确认添加高亮
                    const confirm = await vscode.window.showQuickPick(['是', '否'], {
                        placeHolder: `是否将"${text}"添加为高亮项？`
                    });
                    if (confirm === '是') {
                        this.highlightItems[text] = {
                            path: editor.document.uri.fsPath,
                            range: selection
                        };
                        (0, config_1.writeConfig)({ highlightItems: this.highlightItems });
                        vscode.window.showInformationMessage(`已添加高亮项: ${text}`);
                        this.updateHighlights();
                    }
                }
            }
        });
        // 文档变化时更新高亮
        vscode.workspace.onDidChangeTextDocument(() => {
            this.updateHighlights();
        });
        // 切换编辑器时更新高亮
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.updateHighlights();
            }
        });
        // 重新赋值 clickDisposable（替换空的Disposable）
        this.clickDisposable.dispose(); // 释放空的Disposable
        this.clickDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
            const editor = event.textEditor;
            if (!editor)
                return;
            const position = event.selections[0].active;
            const document = editor.document;
            // 遍历所有高亮项，检查当前位置是否在高亮范围内
            Object.keys(this.highlightItems).forEach(itemText => {
                const regex = new RegExp(itemText, 'g');
                const text = document.getText();
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + itemText.length);
                    const highlightRange = new vscode.Range(startPos, endPos);
                    // 如果当前点击位置在高亮范围内
                    if (highlightRange.contains(position)) {
                        const item = this.highlightItems[itemText];
                        if (item) {
                            // 打开设定文件并定位
                            vscode.workspace.openTextDocument(vscode.Uri.file(item.path)).then(doc => {
                                vscode.window.showTextDocument(doc).then(targetEditor => {
                                    targetEditor.selection = new vscode.Selection(item.range.start, item.range.end);
                                    targetEditor.revealRange(item.range, vscode.TextEditorRevealType.InCenter);
                                });
                            });
                        }
                        return; // 找到匹配项后退出循环
                    }
                }
            });
        });
        this.context.subscriptions.push(this.clickDisposable);
        // 加载已保存的高亮项
        const config = (0, config_1.readConfig)();
        this.highlightItems = config.highlightItems || {};
    }
    /** 更新高亮 */
    updateHighlights() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const text = editor.document.getText();
        const ranges = [];
        // 匹配所有高亮项
        Object.keys(this.highlightItems).forEach(item => {
            const regex = new RegExp(item, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const start = editor.document.positionAt(match.index);
                const end = editor.document.positionAt(match.index + item.length);
                ranges.push(new vscode.Range(start, end));
            }
        });
        // 应用装饰器
        editor.setDecorations(this.decorations.highlight, ranges);
    }
    // 实现 dispose 方法
    dispose() {
        Object.values(this.decorations).forEach(deco => deco.dispose());
        this.clickDisposable.dispose();
    }
}
exports.Highlighter = Highlighter;
//# sourceMappingURL=highlighter.js.map