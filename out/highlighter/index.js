"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHighlighter = void 0;
const highlighter_1 = require("./highlighter");
/**
 * 注册高亮功能
 * @param context 扩展上下文
 */
const registerHighlighter = (context) => {
    const highlighter = new highlighter_1.Highlighter(context);
    context.subscriptions.push(highlighter);
};
exports.registerHighlighter = registerHighlighter;
//# sourceMappingURL=index.js.map