import { readConfig, writeConfig, type NovelHelperConfig, type HighlightItem } from '../utils/config';

export type HighlightItemsMap = NovelHelperConfig['highlightItems'];

export const getHighlightItems = (): HighlightItemsMap => {
  const cfg = readConfig();
  return cfg.highlightItems || {};
};

export const upsertHighlightItem = (key: string, value: HighlightItem): HighlightItemsMap => {
  const cfg = readConfig();
  const next = { ...(cfg.highlightItems || {}), [key]: value };
  writeConfig({ highlightItems: next });
  return next;
};

export const removeHighlightItem = (key: string): HighlightItemsMap => {
  const cfg = readConfig();
  const next = { ...(cfg.highlightItems || {}) };
  delete next[key];
  writeConfig({ highlightItems: next });
  return next;
};
