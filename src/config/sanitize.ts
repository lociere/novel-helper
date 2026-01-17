import { defaultConfig, type NovelHelperConfig } from './types';

/**
 * 兼容旧配置：将 highlightTextColor 迁移到 highlightColor，并移除冗余字段。
 */
export const sanitizeConfig = (raw: unknown): { config: NovelHelperConfig; changed: boolean } => {
  let changed = false;
  const rawObj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : undefined;
  const cfg: NovelHelperConfig = { ...defaultConfig, ...((rawObj || {}) as Partial<NovelHelperConfig>) };

  if (rawObj) {
    // 如果旧配置存在 highlightTextColor，而 highlightColor 未自定义，则迁移值
    const oldHighlightTextColor = rawObj['highlightTextColor'];
    const newHighlightColor = rawObj['highlightColor'];
    if (typeof oldHighlightTextColor === 'string') {
      if (typeof newHighlightColor !== 'string' || newHighlightColor === defaultConfig.highlightColor) {
        cfg.highlightColor = oldHighlightTextColor;
      }
      changed = true;
    }
  }

  if ('highlightTextColor' in (cfg as any)) {
    delete (cfg as any).highlightTextColor;
    changed = true;
  }

  // 移除已废弃字段（历史遗留）
  const deprecatedKeys = [
    'intraLineSpacing',
    'mergeSoftWrappedLines',
    'hardWrapOnFormat',
    'autoHardWrapColumn',
    'autoSyncWordWrapColumn'
  ];
  for (const key of deprecatedKeys) {
    if (key in (cfg as any)) {
      delete (cfg as any)[key];
      changed = true;
    }
  }

  return { config: cfg, changed };
};
