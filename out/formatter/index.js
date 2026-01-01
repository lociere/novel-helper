"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFormatter = void 0;
const formatter_1 = require("./formatter");
/**
 * 注册格式化功能
 * @param context 扩展上下文
 */
const registerFormatter = (context) => {
    const formatter = new formatter_1.Formatter(context);
    context.subscriptions.push(formatter);
};
exports.registerFormatter = registerFormatter;
//# sourceMappingURL=index.js.map