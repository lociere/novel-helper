import * as vscode from 'vscode';
import { getVSCodeConfig, writeConfig, NovelHelperConfig } from '../utils/config'; // 新增导入 NovelHelperConfig

/** 配置项类型 */
interface ConfigItem {
  label: string;
  description: string;
  type: 'number' | 'string' | 'boolean';
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
      label: '整体缩进空格数',
      description: `当前值: ${config.overallIndent}`,
      type: 'number',
      key: 'overallIndent'
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
    },
    {
      label: '隐藏缩进参考线',
      description: `当前值: ${config.autoDisableIndentGuides ? '开启' : '关闭'}`,
      type: 'boolean',
      key: 'autoDisableIndentGuides'
    },
    {
      label: '格式化时硬换行',
      description: `当前值: ${config.hardWrapOnFormat ? '开启' : '关闭'}`,
      type: 'boolean',
      key: 'hardWrapOnFormat'
    },
    {
      label: '自动硬换行阈值',
      description: `当前值: ${config.autoHardWrapColumn} (0 表示关闭)`,
      type: 'number',
      key: 'autoHardWrapColumn'
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

    if (selected.key === 'highlightColor') {
      await handleHighlightColorPick(selected);
    } else if (selected.type === 'boolean') {
      await handleBooleanPick(selected);
    } else {
      await handleGeneralInput(selected);
    }

    quickPick.hide();
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
};

const handleBooleanPick = async (selected: ConfigItem): Promise<void> => {
  const pick = await vscode.window.showQuickPick(
    [
      { label: '开启', value: true },
      { label: '关闭', value: false }
    ],
    {
      title: selected.label,
      placeHolder: '选择开启或关闭'
    }
  );

  if (!pick) { return; }
  applyConfigUpdate(selected, pick.value);
};

const handleHighlightColorPick = async (selected: ConfigItem): Promise<void> => {
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

    applyConfigUpdate(selected, value);
  });
  colorPick.onDidHide(() => colorPick.dispose());
  colorPick.show();
};

const handleGeneralInput = async (selected: ConfigItem): Promise<void> => {
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

  if (!input) { return; }
  const value = selected.type === 'number' ? Number(input) : input;
  applyConfigUpdate(selected, value);

  if (selected.key === 'fontSize') {
    vscode.workspace.getConfiguration('editor').update('fontSize', value, vscode.ConfigurationTarget.Global);
  }
};

const applyConfigUpdate = (selected: ConfigItem, value: string | number | boolean): void => {
  writeConfig({ [selected.key]: value });
  vscode.workspace.getConfiguration('novel-helper').update(selected.key, value, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage(`${selected.label}已更新为: ${value}`);
};