"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const commands_1 = require("./commands");
const treeView_1 = require("./treeView");
const statusBar_1 = require("./statusBar");
const panel_1 = require("./panel");
const highlighter_1 = require("./highlighter");
const stats_1 = require("./stats");
const formatter_1 = require("./formatter");
/**
 * 扩展激活入口
 * @param context 扩展上下文
 */
function activate(context) {
    console.log('novel-helper 已激活！');
    // 注册所有模块
    (0, commands_1.registerCommands)(context);
    (0, treeView_1.registerTreeView)(context);
    (0, statusBar_1.registerStatusBar)(context);
    (0, panel_1.registerPanel)(context);
    (0, highlighter_1.registerHighlighter)(context);
    (0, stats_1.registerStats)(context);
    (0, formatter_1.registerFormatter)(context);
}
/**
 * 扩展停用时执行
 */
function deactivate() {
    console.log('novel-helper 已停用！');
}
//# sourceMappingURL=extension.js.map