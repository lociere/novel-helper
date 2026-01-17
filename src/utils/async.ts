/** 异步/调度相关工具函数 */

/**
 * 防抖：在 delay 内多次触发只执行最后一次。
 * 注意：返回函数不保留 this 绑定（按函数式用法设计）。
 */
export const debounce = (fn: () => void, delayMs: number): (() => void) => {
  let timer: NodeJS.Timeout | undefined;

  return () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn();
    }, Math.max(0, Math.floor(delayMs)));
  };
};

export const isThenable = <T = unknown>(value: unknown): value is Thenable<T> => {
  return !!value
    && typeof value === 'object'
    && 'then' in (value as any)
    && typeof (value as any).then === 'function';
};
