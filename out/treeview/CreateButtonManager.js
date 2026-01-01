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
exports.CreateButtonManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * 创建按钮管理器
 */
class CreateButtonManager {
    /**
     * 处理创建操作
     * @param parentPath 父路径
     * @param createType 创建类型
     */
    async handleCreate(parentPath, createType) {
        switch (createType) {
            case 'volume':
                await this.createFolder(parentPath, '新分卷');
                break;
            case 'chapter':
                await this.createFile(parentPath, '新章节.txt');
                break;
            case 'totalOutline':
                await this.createFile(parentPath, '总大纲.md');
                break;
            case 'subOutline':
                await this.createFile(parentPath, '分大纲.md');
                break;
            case 'character':
                await this.createFile(parentPath, '角色设定.md');
                break;
            case 'thing':
                await this.createFile(parentPath, '事物设定.md');
                break;
            case 'material':
                await this.createFile(parentPath, '素材记录.md');
                break;
            default:
                vscode.window.showErrorMessage(`小说助手：不支持的创建类型 - ${createType}`);
        }
    }
    /**
     * 创建文件夹（自动重命名重复项）
     * @param parentPath 父路径
     * @param baseName 基础名称
     */
    async createFolder(parentPath, baseName) {
        let folderName = baseName;
        let folderPath = path.join(parentPath, folderName);
        let index = 1;
        // 处理重复名称
        while (fs.existsSync(folderPath)) {
            folderName = `${baseName}(${index})`;
            folderPath = path.join(parentPath, folderName);
            index++;
        }
        try {
            await fs.ensureDir(folderPath);
            vscode.window.showInformationMessage(`小说助手：已创建文件夹 - ${folderName}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`小说助手：创建文件夹失败 - ${error.message}`);
        }
    }
    /**
     * 创建文件（自动重命名重复项）
     * @param parentPath 父路径
     * @param baseName 基础名称
     */
    async createFile(parentPath, baseName) {
        const ext = path.extname(baseName);
        const nameWithoutExt = path.basename(baseName, ext);
        let fileName = baseName;
        let filePath = path.join(parentPath, fileName);
        let index = 1;
        // 处理重复名称
        while (fs.existsSync(filePath)) {
            fileName = `${nameWithoutExt}(${index})${ext}`;
            filePath = path.join(parentPath, fileName);
            index++;
        }
        try {
            await fs.ensureFile(filePath);
            // 打开新建的文件
            const uri = vscode.Uri.file(filePath);
            await vscode.window.showTextDocument(uri);
            vscode.window.showInformationMessage(`小说助手：已创建文件 - ${fileName}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`小说助手：创建文件失败 - ${error.message}`);
        }
    }
}
exports.CreateButtonManager = CreateButtonManager;
//# sourceMappingURL=CreateButtonManager.js.map