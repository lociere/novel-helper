import * as vscode from 'vscode';
import { HighlightManager } from './manager';
import { HIGHLIGHT_MAX_KEY_LENGTH } from './utils';

export function registerHighlightCommands(manager: HighlightManager): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
    
  // 1. Add Highlight
  disposables.push(vscode.commands.registerCommand('novel-helper.addHighlight', () => {
    addHighlightLogic(manager, 'selected');
  }));

  // 2. Add From Settings (functionally same as above but different entry point text context usually)
  disposables.push(vscode.commands.registerCommand('novel-helper.addHighlightFromSelection', () => {
    addHighlightLogic(manager, 'setting');
  }));

  // 3. Remove Highlight
  disposables.push(vscode.commands.registerCommand('novel-helper.removeHighlight', async (arg?: unknown) => {
    const keys = manager.getKeys();
    if (keys.length === 0) {
      vscode.window.showInformationMessage('当前没有设置任何高亮');
      return;
    }

    let key = await resolveKey(arg, keys);
    if (!key) {
      key = await vscode.window.showQuickPick(keys, { placeHolder: '选择要移除的高亮项' });
    }

    if (key) {
      manager.removeHighlight(key);
      vscode.window.showInformationMessage(`已移除高亮：“${key}”`);
    }
  }));

  // 4. Jump
  disposables.push(vscode.commands.registerCommand('novel-helper.jumpToHighlightSource', async (arg?: unknown) => {
    const keys = manager.getKeys();
    if (keys.length === 0) {
      vscode.window.showInformationMessage('未找到任何高亮设定');
      return;
    }

    let key = await resolveKey(arg, keys);
    if (!key) {
      key = await vscode.window.showQuickPick(keys, { placeHolder: '选择要跳转的高亮项' });
    }

    if (!key) {return;}

    const item = manager.getItem(key);
    if (!item || !item.path) {
      vscode.window.showErrorMessage(`未找到“${key}”的高亮源信息`);
      return;
    }

    try {
      const doc = await vscode.workspace.openTextDocument(item.path);
      const editor = await vscode.window.showTextDocument(doc);
      editor.revealRange(item.range, vscode.TextEditorRevealType.InCenter);
      editor.selection = new vscode.Selection(item.range.start, item.range.end);
    } catch (e) {
      vscode.window.showErrorMessage('打开高亮源文件失败');
      console.error(e);
    }
  }));

  return disposables;
}

function addHighlightLogic(manager: HighlightManager, type: 'selected' | 'setting') {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('请先打开文本编辑器！');
    return;
  }
  const selection = editor.selection;
  if (selection.isEmpty) {
    vscode.window.showWarningMessage('请先选中要高亮的文本！');
    return;
  }
  const text = editor.document.getText(selection).trim();
  if (!text) {
    vscode.window.showWarningMessage('高亮文本不能为空！');
    return;
  }
  if (text.length > HIGHLIGHT_MAX_KEY_LENGTH) {
    vscode.window.showWarningMessage(`高亮文本过长（>${HIGHLIGHT_MAX_KEY_LENGTH}），请缩短后再添加`);
    return;
  }

  const msg = type === 'selected' ? `已添加高亮项：${text}` : `已为“${text}”添加高亮并保存到设定`;
  manager.addHighlight(text, selection, editor.document.uri.fsPath);
  vscode.window.showInformationMessage(msg);
}

async function resolveKey(arg: unknown, keys: string[]): Promise<string | undefined> {
  if (typeof arg === 'string') {return arg;}

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selectionText = editor.document.getText(editor.selection).trim();
    if (selectionText && keys.includes(selectionText)) {return selectionText;}

    const range = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (range) {
      const word = editor.document.getText(range).trim();
      if (keys.includes(word)) {return word;}
    }
  }
  return undefined;
}
