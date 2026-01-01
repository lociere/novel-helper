"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStatusBar = void 0;
const statusBarManager_1 = require("./statusBarManager");
/**
 * 注册状态栏
 * @param context 扩展上下文
 */
const registerStatusBar = (context) => {
    const statusBarManager = new statusBarManager_1.StatusBarManager(context);
    context.subscriptions.push(statusBarManager);
};
exports.registerStatusBar = registerStatusBar;
//# sourceMappingURL=index.js.map