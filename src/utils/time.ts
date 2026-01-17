/** 时间相关工具函数 */

/** 将毫秒格式化为易读字符串（例如：1天 2小时 3分钟）。 */
export const formatTime = (ms: number): string => {
  if (!ms || ms <= 0) { return '0秒'; }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days) { parts.push(`${days}天`); }
  if (hours) { parts.push(`${hours}小时`); }
  if (minutes) { parts.push(`${minutes}分钟`); }
  if (seconds) { parts.push(`${seconds}秒`); }
  return parts.join(' ');
};

/** 计算写作速度（字/分钟），输入时间为毫秒。 */
export const calculateWritingSpeed = (words: number, ms: number): number => {
  if (!ms || ms <= 0) { return 0; }
  const minutes = ms / 60000;
  if (minutes <= 0) { return 0; }
  return Math.round(words / minutes);
};
