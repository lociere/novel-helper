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
exports.createItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
/**
 * 创建小说项
 * @param type 项类型
 * @param parentPath 父路径
 */
const createItem = async (type, parentPath) => {
    const root = (0, fileSystem_1.getWorkspaceRoot)();
    if (!root) {
        vscode.window.showErrorMessage('未找到工作区');
        return;
    }
    // 输入名称
    const name = await vscode.window.showInputBox({
        prompt: `请输入${type}名称`,
        placeHolder: type,
        validateInput: (value) => {
            if (!value) {
                return '名称不能为空';
            }
            return null;
        }
    });
    if (!name) {
        return;
    }
    // 确定路径和文件类型
    let targetPath;
    const basePath = parentPath || root;
    switch (type) {
        case '总大纲':
            targetPath = path.join(basePath, '大纲', `${name}.md`);
            (0, fileSystem_1.createFile)(targetPath, `# ${name}\n\n`);
            break;
        case '分大纲':
            targetPath = path.join(basePath, '大纲', `${name}.md`);
            (0, fileSystem_1.createFile)(targetPath, `## ${name}\n\n`);
            break;
        case '角色设定':
            targetPath = path.join(basePath, '设定/角色设定', `${name}.md`);
            (0, fileSystem_1.createFile)(targetPath, `# ${name} 设定\n\n`);
            break;
        case '事物设定':
            targetPath = path.join(basePath, '设定/事物设定', `${name}.md`);
            (0, fileSystem_1.createFile)(targetPath, `# ${name} 设定\n\n`);
            break;
        case '图片素材':
            targetPath = path.join(basePath, '素材/图片素材', name);
            (0, fileSystem_1.createDir)(targetPath);
            break;
        case '文字素材':
            targetPath = path.join(basePath, '素材/文字素材', `${name}.md`);
            (0, fileSystem_1.createFile)(targetPath, `# ${name} 素材\n\n`);
            break;
        case '分卷':
            targetPath = path.join(basePath, '正文', name);
            (0, fileSystem_1.createDir)(targetPath);
            break;
        case '章节':
            targetPath = path.join(basePath, `${name}.txt`);
            (0, fileSystem_1.createFile)(targetPath, '');
            break;
    }
    // 刷新树视图
    vscode.commands.executeCommand('novelTreeView.refresh');
};
exports.createItem = createItem;
//# sourceMappingURL=createItems.js.map