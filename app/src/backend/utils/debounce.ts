/**
 * Trailing debounce: `fn` runs once after `waitMs` have passed with no new calls.
 * `flush` runs `fn` immediately with the latest arguments from the last scheduled call.
 * `cancel` drops the pending invocation without calling `fn`.
 */
type DebouncedFn<A extends unknown[]> = ((...args: A) => void) & {
  flush: () => void;
  cancel: () => void;
};

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): DebouncedFn<A> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: A | undefined;

  const debounced = (...args: A): void => {
    lastArgs = args;
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (lastArgs !== undefined) {
        fn(...lastArgs);
      }
    }, waitMs);
  };

  debounced.flush = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (lastArgs !== undefined) {
      fn(...lastArgs);
    }
  };

  debounced.cancel = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced as DebouncedFn<A>;
}
