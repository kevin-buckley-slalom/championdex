let available = 10;
const queue: Array<() => void> = [];

export async function acquireSemaphore(): Promise<void> {
  if (available > 0) {
    available--;
    return;
  }
  return new Promise(resolve => {
    queue.push(resolve);
  });
}

export function releaseSemaphore(): void {
  if (queue.length > 0) {
    const next = queue.shift()!;
    next();
  } else {
    available++;
  }
}

export async function withSemaphore<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSemaphore();
  try {
    return await fn();
  } finally {
    releaseSemaphore();
  }
}
