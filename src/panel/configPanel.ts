import * as vscode from 'vscode';
import { getVSCodeConfig, NovelHelperConfig, getEditorWrapSettings, updateNovelHelperSetting } from '../utils/config';

/** 配置项类型 */
interface ConfigItem {
  label: string;
  description: string;
  type: 'number' | 'string' | 'boolean' | 'action';
  key?: keyof NovelHelperConfig; // 可选：action 类目不需要 key
  action?: () => Promise<void> | void; // 仅 action 类型使用
}

type CategoryItem = vscode.QuickPickItem & { buildItems: () => ConfigItem[] };

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

const paragraphSplitModePresets: Array<{ label: string; value: 'anyBlankLine' | 'requireAll' | 'majority' }> = [
  { label: '只要出现空行就按空行分段（兼容旧逻辑）', value: 'anyBlankLine' },
  { label: '仅当所有段落都有段间空行才按空行分段（否则一行一段）', value: 'requireAll' },
  { label: '当大多数段落都有段间空行时按空行分段（否则一行一段）', value: 'majority' }
];

/**
 * 打开配置面板
 */
export const openConfigPanel = async (): Promise<void> => {
  const config = getVSCodeConfig();
  const editorWrap = getEditorWrapSettings();

  // 一级：分类选择
  const categories: CategoryItem[] = [
    {
      label: '排版与缩进',
      description: '缩进、整体排版',
      buildItems: () => ([
        { label: '段首缩进空格数', description: `当前值: ${config.paragraphIndent}`, type: 'number', key: 'paragraphIndent' },
        { label: '整体缩进空格数', description: `当前值: ${config.overallIndent}`, type: 'number', key: 'overallIndent' },
        { label: '使用全角空格缩进', description: `当前值: ${config.useFullWidthIndent ? '开启' : '关闭'}`, type: 'boolean', key: 'useFullWidthIndent' },
      ])
    },
    {
      label: '段落识别',
      description: '分段规则与兼容策略',
      buildItems: () => ([
        { label: '段落识别策略（空行分段规则）', description: `当前值: ${config.paragraphSplitMode}`, type: 'string', key: 'paragraphSplitMode' },
        { label: '遇到段首缩进强制分段', description: `当前值: ${config.paragraphSplitOnIndentedLine ? '开启' : '关闭'} (默认开启)`, type: 'boolean', key: 'paragraphSplitOnIndentedLine' },
      ])
    },
    {
      label: '行间距与段间距',
      description: '控制空行数量',
      buildItems: () => ([
        { label: '段间距（段间空行数）', description: `当前值: ${config.lineSpacing}`, type: 'number', key: 'lineSpacing' },
        { label: '行间距（段内空行数）', description: `当前值: ${config.intraLineSpacing}`, type: 'number', key: 'intraLineSpacing' },
      ])
    },
    {
      label: '换行与列宽',
      description: '软换行列宽（wordWrapColumn）',
      buildItems: () => ([
        {
          label: 'VS Code 自动换行列宽（wordWrapColumn）',
          description: `当前值: ${config.editorWordWrapColumn}（VS Code 当前: ${editorWrap.wordWrapColumn}, wordWrap: ${editorWrap.wordWrap}）`,
          type: 'number',
          key: 'editorWordWrapColumn'
        },
      ])
    },
    {
      label: '显示与高亮',
      description: '状态栏/高亮/显示相关',
      buildItems: () => ([
        { label: '隐藏缩进参考线', description: `当前值: ${config.autoDisableIndentGuides ? '开启' : '关闭'}`, type: 'boolean', key: 'autoDisableIndentGuides' },
        { label: '字号大小', description: `当前值: ${config.fontSize} (仅修改配置)`, type: 'number', key: 'fontSize' },
        { label: '高亮颜色', description: `当前值: ${config.highlightColor}`, type: 'string', key: 'highlightColor' },
      ])
    }
  ];

  const categoryPick = vscode.window.createQuickPick<CategoryItem>();
  categoryPick.items = categories;
  categoryPick.title = 'Novel Helper 配置面板';
  categoryPick.placeholder = '选择一个类别';

  categoryPick.onDidAccept(() => {
    const chosen = categoryPick.selectedItems[0];
    if (!chosen) { categoryPick.hide(); return; }
    categoryPick.hide();

    const items = chosen.buildItems();
    const quickPick = vscode.window.createQuickPick<ConfigItem>();
    items.push({
      label: '返回上一级',
      description: '返回类别列表',
      type: 'action',
      action: async () => {
        quickPick.hide();
        await openConfigPanel();
      }
    });
    quickPick.items = items;
    quickPick.title = `配置：${chosen.label}`;
    quickPick.placeholder = '选择要修改的条目';

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0];
      if (!selected) { return; }

      if (selected.type === 'action' && selected.action) {
        await selected.action();
        quickPick.hide();
        return;
      }
      if (!selected.key) { return; }

      if (selected.key === 'highlightColor') {
        await handleHighlightColorPick(selected);
      } else if (selected.key === 'paragraphSplitMode') {
        await handleParagraphSplitModePick(selected);
      } else if (selected.type === 'boolean') {
        await handleBooleanPick(selected);
      } else {
        await handleGeneralInput(selected);
      }

      quickPick.hide();
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  });

  categoryPick.onDidHide(() => categoryPick.dispose());
  categoryPick.show();
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
  await applyConfigUpdate(selected, pick.value);
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

    await applyConfigUpdate(selected, value);
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
  await applyConfigUpdate(selected, value);

  if (selected.key === 'fontSize') {
    vscode.workspace.getConfiguration('editor').update('fontSize', value, vscode.ConfigurationTarget.Global);
  }
};

const applyConfigUpdate = async (selected: ConfigItem, value: string | number | boolean): Promise<void> => {
  if (!selected.key) { return; }
  await updateNovelHelperSetting(selected.key, value, vscode.ConfigurationTarget.Workspace);
  vscode.window.showInformationMessage(`${selected.label}已更新为: ${value}`);
};

const handleParagraphSplitModePick = async (selected: ConfigItem): Promise<void> => {
  const pick = await vscode.window.showQuickPick(
    paragraphSplitModePresets.map(p => ({ label: p.label, value: p.value })),
    {
      title: selected.label,
      placeHolder: '选择段落识别策略'
    }
  );

  if (!pick) { return; }
  await applyConfigUpdate(selected, pick.value);
};