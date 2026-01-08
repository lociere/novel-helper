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
exports.initWorkspace = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const helpers_1 = require("../utils/helpers");
const config_1 = require("../utils/config");
/**
 * 初始化小说工作区
 */
const initWorkspace = async () => {
    const root = (0, helpers_1.getWorkspaceRoot)();
    if (!root) {
        vscode.window.showErrorMessage('未找到工作区，请先打开一个文件夹');
        return;
    }
    // 创建标准目录结构
    const dirs = [
        '大纲',
        '设定/角色设定',
        '设定/事物设定',
        '素材/图片素材',
        '素材/文字素材',
        '正文/分卷1'
    ];
    dirs.forEach(dir => {
        (0, fileSystem_1.createDir)(path.join(root, dir));
    });
    // 创建初始文件
    (0, fileSystem_1.createFile)(path.join(root, '大纲/总大纲.md'), '# 总大纲\n\n');
    (0, fileSystem_1.createFile)(path.join(root, '设定/角色设定/主角.md'), '# 主角设定\n\n');
    (0, fileSystem_1.createFile)(path.join(root, '正文/分卷1/第一章.txt'), '');
    // 写入配置文件
    (0, config_1.writeConfig)({ workspacePath: root });
    vscode.window.showInformationMessage('小说工作区初始化成功！');
    // 刷新资源管理器：尝试多个可能的命令并捕获错误以防命令不存在
    const refreshCommands = [
        'workbench.files.action.refreshFilesExplorer',
        'workbench.action.files.refreshFiles',
        'workbench.files.action.refresh'
    ];
    for (const cmd of refreshCommands) {
        try {
            // 某些命令在不同版本或平台上可能不存在，因此用 try/catch 包裹
            // 使用 await 避免未处理的 promise 拒绝
            await vscode.commands.executeCommand(cmd);
            break;
        }
        catch (err) {
            // 如果命令不存在或执行失败，继续尝试下一个命令
            // 最终若都失败则静默忽略，避免抛出未处理异常
            // 仅在开发者工具里打印以便调试
            console.warn(`刷新资源管理器命令 '${cmd}' 无法执行，已忽略。`, err);
        }
    }
};
exports.initWorkspace = initWorkspace;
//# sourceMappingURL=initWorkspace.js.map