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
exports.openConfigPanel = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = require("../utils/config"); // 新增导入 NovelHelperConfig
/**
 * 打开配置面板
 */
const openConfigPanel = async () => {
    const config = (0, config_1.getVSCodeConfig)();
    // 配置项列表
    const configItems = [
        {
            label: '段首缩进空格数',
            description: `当前值: ${config.paragraphIndent}`,
            type: 'number',
            key: 'paragraphIndent' // 现在类型匹配
        },
        {
            label: '行间空行数',
            description: `当前值: ${config.lineSpacing}`,
            type: 'number',
            key: 'lineSpacing' // 现在类型匹配
        },
        {
            label: '字号大小',
            description: `当前值: ${config.fontSize} (仅修改配置)`,
            type: 'number',
            key: 'fontSize'
        },
        {
            label: '高亮背景色',
            description: `当前值: ${config.highlightColor}`,
            type: 'string',
            key: 'highlightColor' // 现在类型匹配
        },
        {
            label: '高亮文本色',
            description: `当前值: ${config.highlightTextColor}`,
            type: 'string',
            key: 'highlightTextColor' // 现在类型匹配
        }
    ];
    // 创建快速选择面板
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = configItems;
    quickPick.title = 'Novel Helper 配置面板';
    quickPick.placeholder = '选择要修改的配置项';
    // 选择配置项后输入新值
    quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        if (!selected) {
            return;
        }
        // 输入新值
        const input = await vscode.window.showInputBox({
            prompt: `请输入${selected.label}的新值`,
            placeHolder: selected.description.split(': ')[1],
            validateInput: (value) => {
                if (!value) {
                    return '值不能为空';
                }
                if (selected.type === 'number' && isNaN(Number(value))) {
                    return '请输入数字';
                }
                return null;
            }
        });
        if (input) {
            // 更新配置
            const value = selected.type === 'number' ? Number(input) : input;
            (0, config_1.writeConfig)({ [selected.key]: value });
            vscode.workspace.getConfiguration('novel-helper').update(selected.key, value, vscode.ConfigurationTarget.Workspace);
            // 特殊处理：如果是字号大小，同步更新编辑器设置
            if (selected.key === 'fontSize') {
                vscode.workspace.getConfiguration('editor').update('fontSize', value, vscode.ConfigurationTarget.Global);
            }
            vscode.window.showInformationMessage(`${selected.label}已更新为: ${value}`);
        }
        quickPick.hide();
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
};
exports.openConfigPanel = openConfigPanel;
//# sourceMappingURL=configPanel.js.map