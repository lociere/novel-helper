/**
 * 兼容层：旧代码可继续从 helpers 引用。
 * 新代码建议按职责使用：
 * - src/utils/text.ts
 * - src/utils/time.ts
 * - src/utils/workspace.ts
 */

export { countWords } from './text';
export { formatTime, calculateWritingSpeed } from './time';
export { getWorkspaceRoot } from './workspace';
