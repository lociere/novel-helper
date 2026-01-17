import * as vscode from 'vscode';
import { escapeRegExp, HIGHLIGHT_MAX_DOC_CHARS, HIGHLIGHT_MAX_MATCHES_PER_ITEM } from './utils';

export interface ValidatedHighlightItem {
    path?: string;
    range: vscode.Range;
}

export class HighlightMatcher {
  private regexCache = new Map<string, RegExp>();

  /**
     * 计算文档中所有匹配的高亮范围
     */
  public findRanges(
    itemKey: string,
    itemData: ValidatedHighlightItem | undefined,
    document: vscode.TextDocument,
    fullText: string
  ): vscode.Range[] {
    const ranges: vscode.Range[] = [];

    // 1. 如果当前文档就是源文件，且有持久化位置，优先使用
    if (itemData?.path && document.uri.fsPath === itemData.path) {
      // itemData.range 已经是 vscode.Range (在 Manager 层解析过)
      ranges.push(itemData.range);
            
      // 如果文档过大，不再进行正则搜索，直接返回源位置
      if (fullText.length > HIGHLIGHT_MAX_DOC_CHARS) {
        return ranges; 
      }
    } else if (fullText.length > HIGHLIGHT_MAX_DOC_CHARS) {
      // 非源文件且文档过大，跳过搜索
      return ranges;
    }

    // 2. 确定搜索用的文本关键字
    let searchText = itemKey;
    // 如果能从源文件的高亮范围读取到最新文本（例如用户重命名了），这里逻辑比较复杂，
    // 原始代码是: if (hi && hi.path && document.uri.fsPath === hi.path ...)
    // 但其实只有在 document 是源文件时才能读到 range 对应的文本。
    // 如果 document 是源文件，我们已经把 ranges push 进去了。
    // 对于正则匹配，我们通常使用 key (text)，除非我们确实知道 source range 对应的 text 变了。
    // 原始逻辑尝试读取 current document 范围内的 text。
        
    if (itemData?.path && document.uri.fsPath === itemData.path) {
      try {
        const actual = document.getText(itemData.range).trim();
        if (actual && actual !== itemKey) {
          searchText = actual;
        }
      } catch {
        // ignore
      }
    }

    // 3. 正则全局匹配
    const regex = this.getOrUpdateRegex(searchText);
    let match;
    // 重置 regex
    regex.lastIndex = 0;
    let matchCount = 0;

    while ((match = regex.exec(fullText)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
            
      // 避免与源 range 重复 (简单的相同位置检查)
      if (ranges.length > 0) {
        const isDuplicate = ranges.some(r => r.start.isEqual(startPos) && r.end.isEqual(endPos));
        if (isDuplicate) { continue; }
      }
            
      ranges.push(new vscode.Range(startPos, endPos));

      matchCount++;
      if (matchCount >= HIGHLIGHT_MAX_MATCHES_PER_ITEM) {
        break;
      }
    }

    return ranges;
  }

  public clearCache(key?: string) {
    if (key) {
      this.regexCache.delete(key);
    } else {
      this.regexCache.clear();
    }
  }

  private getOrUpdateRegex(text: string): RegExp {
    let regex = this.regexCache.get(text);
    if (!regex) {
      const escaped = escapeRegExp(text);
      regex = new RegExp(escaped, 'g');
      this.regexCache.set(text, regex);
    }
    return regex;
  }
}
