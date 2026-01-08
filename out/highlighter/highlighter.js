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
exports.registerHighlighter = exports.Highlighter = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("../utils/config");
/**
 * 文本高亮管理器（优化版：性能提升+错误处理）
 */
class Highlighter {
    constructor(context) {
        this.disposables = [];
        this.decorations = {
            highlight: vscode.window.createTextEditorDecorationType({
                isWholeLine: false,
                // 使用背景色代替 className 属性以满足 typings
                backgroundColor: 'rgba(255,215,0,0.15)'
            })
        };
        this.highlightItems = {};
        this.regexCache = new Map(); // 初始化正则缓存
        // 从配置中加载持久化的高亮
        try {
            const cfg = (0, config_1.readConfig)();
            const items = cfg.highlightItems || {};
            Object.keys(items).forEach(key => {
                const v = items[key];
                try {
                    const range = new vscode.Range(new vscode.Position(v.range.start.line, v.range.start.character), new vscode.Position(v.range.end.line, v.range.end.character));
                    this.highlightItems[key] = { path: v.path, range };
                }
                catch (e) {
                    // 忽略解析错误
                    console.warn('[Novel Helper] 解析高亮位置失败：', key, e);
                }
            });
        }
        catch (e) {
            console.warn('[Novel Helper] 读取高亮配置失败：', e);
        }
        // 注册高亮相关命令
        this.registerCommands(context);
        // 监听文本变化更新高亮
        this.registerEventListeners(context);
    }
    /**
     * 注册高亮相关命令
     */
    registerCommands(context) {
        // 添加高亮项命令
        const addHighlightDisposable = vscode.commands.registerCommand('novel-helper.addHighlight', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('请先打开文本编辑器！');
                return;
            }
            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showWarningMessage('请先选中要高亮的文本！');
                return;
            }
            const text = editor.document.getText(selection).trim();
            if (!text) {
                vscode.window.showWarningMessage('高亮文本不能为空！');
                return;
            }
            // 序列化范围并写入配置，确保关闭后重开依然生效
            const serialRange = {
                start: { line: selection.start.line, character: selection.start.character },
                end: { line: selection.end.line, character: selection.end.character }
            };
            const cfg = (0, config_1.readConfig)();
            const newItems = { ...(cfg.highlightItems || {}), [text]: { path: editor.document.uri.fsPath, range: serialRange } };
            (0, config_1.writeConfig)({ highlightItems: newItems });
            this.highlightItems[text] = {
                path: editor.document.uri.fsPath,
                range: selection
            };
            this.updateHighlights();
            vscode.window.showInformationMessage(`已添加高亮项：${text}`);
        });
        context.subscriptions.push(addHighlightDisposable);
        // 从设定文件中添加高亮（会持久化）
        const addFromSettingDisposable = vscode.commands.registerCommand('novel-helper.addHighlightFromSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('请先打开文本编辑器！');
                return;
            }
            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showWarningMessage('请先在设定文件中选中要高亮的文本！');
                return;
            }
            const text = editor.document.getText(selection).trim();
            if (!text) {
                vscode.window.showWarningMessage('高亮文本不能为空！');
                return;
            }
            // 序列化范围并写入配置
            const serialRange = {
                start: { line: selection.start.line, character: selection.start.character },
                end: { line: selection.end.line, character: selection.end.character }
            };
            const cfg = (0, config_1.readConfig)();
            const newItems = { ...(cfg.highlightItems || {}), [text]: { path: editor.document.uri.fsPath, range: serialRange } };
            (0, config_1.writeConfig)({ highlightItems: newItems });
            // 更新内存并刷新高亮
            this.highlightItems[text] = { path: editor.document.uri.fsPath, range: selection };
            this.updateHighlights();
            vscode.window.showInformationMessage(`已为“${text}”添加高亮并保存到设定`);
        });
        context.subscriptions.push(addFromSettingDisposable);
        // 跳转到高亮源文件
        const jumpDisposable = vscode.commands.registerCommand('novel-helper.jumpToHighlightSource', async (arg) => {
            const cfg = (0, config_1.readConfig)();
            const items = cfg.highlightItems || {};
            const keys = Object.keys(items);
            if (keys.length === 0) {
                vscode.window.showInformationMessage('未找到任何高亮设定');
                return;
            }
            let selectedKey;
            // 1. 如果参数是字符串，直接使用（可能是从代码调用）
            if (typeof arg === 'string') {
                selectedKey = arg;
            }
            // 2. 尝试从当前编辑器选区或光标位置获取
            else {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    // 优先检查选区
                    const selectionText = editor.document.getText(editor.selection).trim();
                    if (selectionText && items[selectionText]) {
                        selectedKey = selectionText;
                    }
                    // 其次检查光标下的单词
                    else {
                        const range = editor.document.getWordRangeAtPosition(editor.selection.active);
                        if (range) {
                            const word = editor.document.getText(range).trim();
                            if (items[word]) {
                                selectedKey = word;
                            }
                        }
                    }
                }
            }
            // 3. 如果仍未确定key，则显示选择列表
            if (!selectedKey) {
                selectedKey = await vscode.window.showQuickPick(keys, { placeHolder: '选择要跳转的高亮项' });
            }
            if (!selectedKey) {
                return;
            }
            const hi = items[selectedKey];
            if (!hi) {
                vscode.window.showErrorMessage(`未找到“${selectedKey}”的高亮源信息`);
                return;
            }
            try {
                const doc = await vscode.workspace.openTextDocument(hi.path);
                const ed = await vscode.window.showTextDocument(doc);
                const range = new vscode.Range(new vscode.Position(hi.range.start.line, hi.range.start.character), new vscode.Position(hi.range.end.line, hi.range.end.character));
                ed.revealRange(range, vscode.TextEditorRevealType.InCenter);
                ed.selection = new vscode.Selection(range.start, range.end);
            }
            catch (err) {
                console.error('[Novel Helper] 跳转到高亮源失败：', err);
                vscode.window.showErrorMessage('打开高亮源文件失败');
            }
        });
        context.subscriptions.push(jumpDisposable);
        // 移除高亮
        const removeDisposable = vscode.commands.registerCommand('novel-helper.removeHighlight', async (arg) => {
            const cfg = (0, config_1.readConfig)();
            const items = cfg.highlightItems || {};
            const keys = Object.keys(items);
            if (keys.length === 0) {
                vscode.window.showInformationMessage('当前没有设置任何高亮');
                return;
            }
            let selectedKey;
            // 1. 如果参数是字符串，直接使用
            if (typeof arg === 'string') {
                selectedKey = arg;
            }
            // 2. 尝试从当前编辑器选区或光标位置获取
            else {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const selectionText = editor.document.getText(editor.selection).trim();
                    if (selectionText && items[selectionText]) {
                        selectedKey = selectionText;
                    }
                    else {
                        const range = editor.document.getWordRangeAtPosition(editor.selection.active);
                        if (range) {
                            const word = editor.document.getText(range).trim();
                            if (items[word]) {
                                selectedKey = word;
                            }
                        }
                    }
                }
            }
            // 3. 如果未确定，显示列表供选择
            if (!selectedKey) {
                selectedKey = await vscode.window.showQuickPick(keys, { placeHolder: '选择要移除的高亮项' });
            }
            if (!selectedKey) {
                return;
            }
            // 执行删除
            delete items[selectedKey];
            (0, config_1.writeConfig)({ highlightItems: items });
            // 更新内存
            delete this.highlightItems[selectedKey];
            this.regexCache.delete(selectedKey);
            this.updateHighlights();
            vscode.window.showInformationMessage(`已移除高亮：“${selectedKey}”`);
        });
        context.subscriptions.push(removeDisposable);
    }
    /**
     * 注册事件监听器（优化：添加防抖减少高频触发）
     */
    registerEventListeners(context) {
        // 防抖函数：300ms内仅执行一次，减少性能消耗
        const debounceUpdate = (func, delay) => {
            let timeout;
            return () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(), delay);
            };
        };
        // 防抖后的更新方法
        const debouncedUpdate = debounceUpdate(() => this.updateHighlights(), 300);
        // 文本变化时更新高亮（防抖）
        const docDisposable = vscode.workspace.onDidChangeTextDocument(() => {
            debouncedUpdate();
        });
        // 切换编辑器时更新高亮（防抖）
        const editorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
            debouncedUpdate();
        });
        context.subscriptions.push(docDisposable, editorDisposable);
        this.disposables.push(docDisposable, editorDisposable);
        // 监听可见编辑器变化（处理分屏等多编辑器情况）
        const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(() => {
            debouncedUpdate();
        });
        context.subscriptions.push(visibleEditorsDisposable);
        this.disposables.push(visibleEditorsDisposable);
        // 初始化时立即更新所有可见编辑器的高亮
        this.updateHighlights();
    }
    /**
     * 转义正则特殊字符（避免正则语法错误）
     * @param str 原始字符串
     * @returns 转义后的字符串
     */
    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * 更新所有可见编辑器的高亮
     */
    updateHighlights() {
        // 遍历所有可见编辑器，而不仅仅是 activeTextEditor
        vscode.window.visibleTextEditors.forEach(editor => {
            this.updateEditorHighlights(editor);
        });
    }
    /**
     * 更新单个编辑器的高亮
     */
    updateEditorHighlights(editor) {
        if (!editor || !editor.document) {
            return;
        }
        const document = editor.document;
        const text = document.getText();
        const ranges = [];
        Object.keys(this.highlightItems).forEach(item => {
            // 跳过空高亮项
            if (!item || item.trim() === '') {
                return;
            }
            try {
                const itemRanges = this.calculateItemRanges(item, document, text);
                this.mergeRanges(ranges, itemRanges);
            }
            catch (error) {
                console.error(`[Novel Helper] 高亮匹配失败 - 项：${item}`, error);
                // 移除错误的高亮项，避免持续报错
                delete this.highlightItems[item];
                this.regexCache.delete(item);
            }
        });
        // 应用装饰器
        editor.setDecorations(this.decorations.highlight, ranges);
    }
    /**
     * 计算单个高亮项的所有匹配范围
     */
    calculateItemRanges(itemKey, document, fullText) {
        const ranges = [];
        const hi = this.highlightItems[itemKey];
        // 1. 如果当前文档就是源文件，优先使用持久化的范围
        if (hi && hi.path && document.uri.fsPath === hi.path) {
            const sourceRange = this.getPersistedRange(hi.range);
            if (sourceRange) {
                ranges.push(sourceRange);
            }
        }
        // 2. 确定搜索用的文本关键字
        let searchText = itemKey;
        // 如果能从源文件读取到最新文本，优先使用
        if (hi && hi.path && document.uri.fsPath === hi.path && hi.range instanceof vscode.Range) {
            try {
                const actual = document.getText(hi.range).trim();
                if (actual) {
                    searchText = actual;
                }
            }
            catch (e) {
                // ignore
            }
        }
        // 3. 正则全局匹配
        const regex = this.getOrUpdateRegex(searchText);
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(fullText)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const newRange = new vscode.Range(startPos, endPos);
            ranges.push(newRange);
        }
        return ranges;
    }
    /**
     * 将新范围合并到结果列表（简单的去重）
     */
    mergeRanges(target, source) {
        source.forEach(newRange => {
            const isDuplicate = target.some(r => r.start.isEqual(newRange.start) && r.end.isEqual(newRange.end));
            if (!isDuplicate) {
                target.push(newRange);
            }
        });
    }
    /**
     * 获取或转换持久化的 Range 对象
     */
    getPersistedRange(range) {
        try {
            if (range instanceof vscode.Range) {
                return range;
            }
            return new vscode.Range(new vscode.Position(range.start.line, range.start.character), new vscode.Position(range.end.line, range.end.character));
        }
        catch {
            return null;
        }
    }
    /**
     * 获取或创建正则表达式（带缓存）
     */
    getOrUpdateRegex(text) {
        let regex = this.regexCache.get(text);
        if (!regex) {
            const escapedItem = this.escapeRegExp(text);
            regex = new RegExp(escapedItem, 'g');
            this.regexCache.set(text, regex);
        }
        return regex;
    }
    /**
     * 清理资源
     */
    dispose() {
        // 清理所有注册的 disposables
        this.disposables.forEach(d => {
            try {
                d.dispose();
            }
            catch (e) { /* ignore */ }
        });
        // 销毁装饰器
        Object.keys(this.decorations).forEach(k => {
            try {
                this.decorations[k].dispose();
            }
            catch (e) { /* ignore */ }
        });
    }
}
exports.Highlighter = Highlighter;
/**
 * 注册高亮管理器
 * @param context 扩展上下文
 */
const registerHighlighter = (context) => {
    new Highlighter(context);
};
exports.registerHighlighter = registerHighlighter;
//# sourceMappingURL=highlighter.js.map