import * as vscode from 'vscode';
import { getVSCodeConfig, writeConfig, NovelHelperConfig } from '../utils/config'; // 新增导入 NovelHelperConfig

/** 配置项类型 */
interface ConfigItem {
  label: string;
  description: string;
  type: 'number' | 'string';
  key: keyof NovelHelperConfig; // 修复：指定 key 类型为 NovelHelperConfig 的键
}

/**
 * 打开配置面板
 */
export const openConfigPanel = async (): Promise<void> => {
  const config = getVSCodeConfig();

  // 配置项列表
  const configItems: ConfigItem[] = [
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
  const quickPick = vscode.window.createQuickPick<ConfigItem>();
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
      writeConfig({ [selected.key]: value });
      vscode.workspace.getConfiguration('novel-helper').update(selected.key, value, vscode.ConfigurationTarget.Workspace);
      vscode.window.showInformationMessage(`${selected.label}已更新为: ${value}`);
    }

    quickPick.hide();
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
};