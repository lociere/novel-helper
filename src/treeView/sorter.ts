import * as path from 'path';
import { NovelTreeItem } from './treeItem';

const digitMap: Record<string, number> = {
  '零': 0, '〇': 0,
  '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9
};

const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });

/**
 * 将中文数字转换为阿拉伯数字
 * 支持：一二三（纯数字模式）和 一百二十三（单位模式）
 */
export function parseChineseNumber(raw: string): number | null {
  const s = raw.replace(/[\s　]+/g, '');
  if (!s) { return null; }

  // 纯数字串：一二三（不含十百千）
  if (/^[零〇一二两三四五六七八九]+$/.test(s)) {
    let n = 0;
    for (const ch of s) {
      n = n * 10 + (digitMap[ch] ?? 0);
    }
    return n;
  }

  // 含单位：十百千（支持到 9999 左右的常见章节/卷号）
  if (!/^[零〇一二两三四五六七八九十百千]+$/.test(s)) { return null; }

  let result = 0;
  let current = 0;

  const flushUnit = (unit: number) => {
    const v = current === 0 ? 1 : current;
    result += v * unit;
    current = 0;
  };

  for (const ch of s) {
    if (ch === '千') { flushUnit(1000); continue; }
    if (ch === '百') { flushUnit(100); continue; }
    if (ch === '十') { flushUnit(10); continue; }
    const d = digitMap[ch];
    if (typeof d === 'number') { current = d; }
  }
  result += current;
  return result > 0 ? result : null;
}

/**
 * 解析文件名前缀中的数字索引
 * 支持：第十二章、1. xxx、一、xxx 等
 */
export function parseLeadingIndex(name: string): number | null {
  const trimmed = name.trim();

  // 常见：第十二章 / 第十二卷 / 第12章
  const m1 = trimmed.match(/^第\s*([0-9]+)\s*[卷章节回话部集]?/);
  if (m1) { return Number(m1[1]); }
  const m2 = trimmed.match(/^第\s*([零〇一二两三四五六七八九十百千]+)\s*[卷章节回话部集]?/);
  if (m2) { return parseChineseNumber(m2[1]); }

  // 纯数字前缀：01 xxx / 1. xxx / 1、xxx
  const m3 = trimmed.match(/^([0-9]+)\s*([\.、_\-\s]|$)/);
  if (m3) { return Number(m3[1]); }

  // 纯中文数字前缀：一 二 三 / 十二
  const m4 = trimmed.match(/^([零〇一二两三四五六七八九十百千]+)\s*([\.、_\-\s]|$)/);
  if (m4) { return parseChineseNumber(m4[1]); }

  return null;
}

export type SortContext = '正文' | '大纲' | 'default';

export function getDirContext(dirPath: string): SortContext {
  const base = path.basename(dirPath);
  if (base === '正文') { return '正文'; }
  if (base === '大纲') { return '大纲'; }
    
  // 正文下的分卷目录，也按正文规则排序
  const parent = path.basename(path.dirname(dirPath));
  if (parent === '正文') { return '正文'; }
    
  return 'default';
}

function getSpecialGroup(name: string, ctx: SortContext): number {
  if (ctx === '大纲') {
    if (name.includes('总大纲')) { return 0; }
    if (name.includes('分大纲')) { return 1; }
    return 2;
  }
  if (ctx === '正文') {
    // 序章/楔子等放在最前，但仍保持小于第一章
    if (/^(序章|楔子|引子|前言)/.test(name)) { return 0; }
    // 正文常规章节/卷：走编号排序
    return 1;
  }
  return 0;
}

function buildSortKey(item: NovelTreeItem, ctx: SortContext, originalIndex: number): {
    typeRank: number;
    groupRank: number;
    numberRank: number;
    name: string;
    originalIndex: number;
} {
  const name = typeof item.label === 'string' ? item.label : item.label?.toString() || '';
  const typeRank = item.type === 'directory' ? 0 : 1;
  const groupRank = getSpecialGroup(name, ctx);

  // 正文：尽量按章节/卷编号升序；缺失编号的放后面
  let numberRank = Number.POSITIVE_INFINITY;
  if (ctx === '正文') {
    const n = parseLeadingIndex(name);
    if (n !== null && n !== undefined) {
      numberRank = n;
    }
  }

  return { typeRank, groupRank, numberRank, name, originalIndex };
}

export function sortTreeItems(items: NovelTreeItem[], dirPath?: string): NovelTreeItem[] {
  const createItems = items.filter(i => i.type === 'create-item');
  const normalItems = items.filter(i => i.type !== 'create-item');

  const ctx = dirPath ? getDirContext(dirPath) : 'default';

  const keyed = normalItems.map((item, idx) => ({ item, key: buildSortKey(item, ctx, idx) }));
    
  keyed.sort((a, b) => {
    if (a.key.typeRank !== b.key.typeRank) { return a.key.typeRank - b.key.typeRank; }
    if (a.key.groupRank !== b.key.groupRank) { return a.key.groupRank - b.key.groupRank; }
    if (a.key.numberRank !== b.key.numberRank) { return a.key.numberRank - b.key.numberRank; }

    const byName = collator.compare(a.key.name, b.key.name);
    if (byName !== 0) { return byName; }
    return a.key.originalIndex - b.key.originalIndex;
  });

  return [...keyed.map(k => k.item), ...createItems];
}
