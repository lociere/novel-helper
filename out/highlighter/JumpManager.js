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
exports.JumpManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs-extra"));
/**
 * 高亮跳转管理器
 */
class JumpManager {
    currentEditor = null;
    disposable = null;
    /**
     * 绑定跳转事件
     * @param editor 当前编辑器
     * @param characterItems 角色高亮项
     * @param thingItems 事物高亮项
     */
    bindJumpEvent(editor, characterItems, thingItems) {
        // 清理旧监听
        this.dispose();
        this.currentEditor = editor;
        // 监听光标选择变化
        this.disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
            // 仅处理当前编辑器且是鼠标触发的选择
            if (event.textEditor !== this.currentEditor || event.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
                return;
            }
            const selection = event.selections[0];
            if (!selection.isEmpty)
                return;
            this.checkJump(selection.active, editor, characterItems, thingItems);
        });
    }
    /**
     * 检查是否需要跳转
     * @param position 光标位置
     * @param editor 当前编辑器
     * @param characterItems 角色高亮项
     * @param thingItems 事物高亮项
     */
    checkJump(position, editor, characterItems, thingItems) {
        const text = editor.document.getText();
        const offset = editor.document.offsetAt(position);
        // 检查角色高亮
        for (const item of characterItems) {
            const target = item.text;
            let index = 0;
            while (index < text.length) {
                const startIndex = text.indexOf(target, index);
                if (startIndex === -1)
                    break;
                const endIndex = startIndex + target.length;
                if (offset >= startIndex && offset <= endIndex) {
                    this.jumpToSource(item.sourcePath, item.line);
                    return;
                }
                index = endIndex;
            }
        }
        // 检查事物高亮
        for (const item of thingItems) {
            const target = item.text;
            let index = 0;
            while (index < text.length) {
                const startIndex = text.indexOf(target, index);
                if (startIndex === -1)
                    break;
                const endIndex = startIndex + target.length;
                if (offset >= startIndex && offset <= endIndex) {
                    this.jumpToSource(item.sourcePath, item.line);
                    return;
                }
                index = endIndex;
            }
        }
    }
    /**
     * 跳转到源文件
     * @param sourcePath 源文件路径
     * @param line 行号
     */
    async jumpToSource(sourcePath, line) {
        if (!fs.existsSync(sourcePath)) {
            vscode.window.showErrorMessage(`小说助手：源文件不存在 - ${sourcePath}`);
            return;
        }
        try {
            const uri = vscode.Uri.file(sourcePath);
            const editor = await vscode.window.showTextDocument(uri);
            // 定位到指定行（行号从0开始）
            const targetPosition = new vscode.Position(line - 1, 0);
            editor.selection = new vscode.Selection(targetPosition, targetPosition);
            // 滚动到视图中央
            editor.revealRange(new vscode.Range(targetPosition, targetPosition), vscode.TextEditorRevealType.InCenter);
        }
        catch (error) {
            vscode.window.showErrorMessage(`小说助手：跳转失败 - ${error.message}`);
        }
    }
    /**
     * 清理资源
     */
    dispose() {
        if (this.disposable) {
            this.disposable.dispose();
            this.disposable = null;
        }
        this.currentEditor = null;
    }
}
exports.JumpManager = JumpManager;
//# sourceMappingURL=JumpManager.js.map