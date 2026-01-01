"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStats = void 0;
const statsManager_1 = require("./statsManager");
/**
 * 注册统计功能
 * @param context 扩展上下文
 */
const registerStats = (context) => {
    const statsManager = new statsManager_1.StatsManager(context);
    context.subscriptions.push(statsManager);
};
exports.registerStats = registerStats;
//# sourceMappingURL=index.js.map