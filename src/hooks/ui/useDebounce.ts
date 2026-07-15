import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to debounce a value with a specified delay.
 * Returns the debounced value after the specified milliseconds have passed
 * without the original value changing.
 *
 * Does NOT fire on mount with the initial value. Only fires on subsequent changes.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the effect on first render to avoid firing with initial empty value
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
