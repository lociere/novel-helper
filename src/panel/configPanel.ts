import * as vscode from 'vscode';
import { getVSCodeConfig, writeConfig, NovelHelperConfig } from '../utils/config'; // 新增导入 NovelHelperConfig

/** 配置项类型 */
interface ConfigItem {
  label: string;
  description: string;
  type: 'number' | 'string';
  key: keyof NovelHelperConfig; // 修复：指定 key 类型为 NovelHelperConfig 的键
}

const highlightColorPresets = [
  { label: '金色 (默认)', value: '#FFD700' },
  { label: '琥珀', value: '#FFC107' },
  { label: '薄荷绿', value: '#4CAF50' },
  { label: '天空蓝', value: '#03A9F4' },
  { label: '珊瑚橙', value: '#FF7043' },
  { label: '洋红', value: '#E91E63' },
  { label: '薰衣草', value: '#7E57C2' },
  { label: '自定义...', value: 'custom' }
];

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
      label: '字号大小',
      description: `当前值: ${config.fontSize} (仅修改配置)`,
      type: 'number',
      key: 'fontSize'
    },
    {
      label: '高亮颜色',
      description: `当前值: ${config.highlightColor}`,
      type: 'string',
      key: 'highlightColor' // 现在类型匹配
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

    // 高亮颜色使用预设选择器，其他项使用常规输入框
    if (selected.key === 'highlightColor') {
      const colorPick = vscode.window.createQuickPick<typeof highlightColorPresets[number]>();
      colorPick.items = highlightColorPresets;
      colorPick.title = '选择高亮颜色';
      colorPick.placeholder = '选择预设或自定义';
      colorPick.onDidAccept(async () => {
        const chosen = colorPick.selectedItems[0];
        if (!chosen) { colorPick.hide(); return; }
        colorPick.hide();

        let value = chosen.value;
        if (value === 'custom') {
          const custom = await vscode.window.showInputBox({
            prompt: '输入自定义颜色（十六进制，如 #FFAA00）',
            placeHolder: '#FFD700',
            validateInput: v => {
              if (!v) { return '值不能为空'; }
              return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v) ? null : '请输入正确的十六进制颜色，如 #FFAA00';
            }
          });
          if (!custom) { return; }
          value = custom;
        }

        writeConfig({ [selected.key]: value });
        vscode.workspace.getConfiguration('novel-helper').update(selected.key, value, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`${selected.label}已更新为: ${value}`);
      });
      colorPick.onDidHide(() => colorPick.dispose());
      colorPick.show();
    } else {
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
        const value = selected.type === 'number' ? Number(input) : input;
        writeConfig({ [selected.key]: value });
        vscode.workspace.getConfiguration('novel-helper').update(selected.key, value, vscode.ConfigurationTarget.Workspace);
        
        // 特殊处理：如果是字号大小，同步更新编辑器设置
        if (selected.key === 'fontSize') {
          vscode.workspace.getConfiguration('editor').update('fontSize', value, vscode.ConfigurationTarget.Global);
        }

        vscode.window.showInformationMessage(`${selected.label}已更新为: ${value}`);
      }
    }

    quickPick.hide();
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
};