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
exports.HighlightManager = void 0;
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const JumpManager_1 = require("./JumpManager");
/**
 * 高亮管理器
 */
class HighlightManager {
    decorationTypes;
    jumpManager;
    disposable = null;
    constructor() {
        // 初始化装饰器
        const config = extension_1.configManager.getConfig().highlight.colors;
        this.decorationTypes = {
            character: this.createDecorationType(config.character),
            thing: this.createDecorationType(config.thing)
        };
        this.jumpManager = new JumpManager_1.JumpManager();
    }
    /**
     * 初始化高亮
     */
    init() {
        // 监听编辑器切换
        this.disposable = vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this.updateHighlights(editor);
            }
        });
        // 初始化当前编辑器高亮
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.updateHighlights(activeEditor);
        }
    }
    /**
     * 创建装饰器类型
     * @param color 背景色
     */
    createDecorationType(color) {
        return vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '2px'
        });
    }
    /**
     * 更新编辑器高亮
     * @param editor 编辑器
     */
    updateHighlights(editor) {
        const config = extension_1.configManager.getConfig().highlight;
        // 获取角色高亮范围
        const characterRanges = this.getHighlightRanges(editor, config.character.map(item => item.text));
        // 获取事物高亮范围
        const thingRanges = this.getHighlightRanges(editor, config.thing.map(item => item.text));
        // 应用高亮
        editor.setDecorations(this.decorationTypes.character, characterRanges);
        editor.setDecorations(this.decorationTypes.thing, thingRanges);
        // 绑定跳转事件
        this.jumpManager.bindJumpEvent(editor, config.character, config.thing);
    }
    /**
     * 获取高亮范围
     * @param editor 编辑器
     * @param texts 要高亮的文本列表
     */
    getHighlightRanges(editor, texts) {
        const decorations = [];
        const text = editor.document.getText();
        texts.forEach(target => {
            if (!target)
                return;
            let index = 0;
            while (index < text.length) {
                const startIndex = text.indexOf(target, index);
                if (startIndex === -1)
                    break;
                const endIndex = startIndex + target.length;
                const startPos = editor.document.positionAt(startIndex);
                const endPos = editor.document.positionAt(endIndex);
                decorations.push({
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: new vscode.MarkdownString(`点击跳转到【${target}】的定义`)
                });
                index = endIndex;
            }
        });
        return decorations;
    }
    /**
     * 清理资源
     */
    dispose() {
        this.jumpManager.dispose();
        if (this.disposable) {
            this.disposable.dispose();
        }
        Object.values(this.decorationTypes).forEach(type => type.dispose());
    }
}
exports.HighlightManager = HighlightManager;
//# sourceMappingURL=HighlightManager.js.map