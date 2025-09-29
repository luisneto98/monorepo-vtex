export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debouncedCallback = debounce(callback, delay);
  return debouncedCallback as T;
}