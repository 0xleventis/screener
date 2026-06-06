type Task<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

class ApiThrottle {
  private queue: Task<unknown>[] = [];
  private active = 0;
  private readonly maxConcurrent = 2;
  private readonly maxPerMinute = 25;
  private callTimestamps: number[] = [];

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject } as Task<unknown>);
      this.drain();
    });
  }

  private drain() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;

    const now = Date.now();
    this.callTimestamps = this.callTimestamps.filter(t => now - t < 60_000);

    if (this.callTimestamps.length >= this.maxPerMinute) {
      const oldest = this.callTimestamps[0];
      const waitMs = 60_000 - (now - oldest) + 200;
      setTimeout(() => this.drain(), waitMs);
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.active++;
    this.callTimestamps.push(Date.now());

    task.fn().then(task.resolve, task.reject).finally(() => {
      this.active--;
      this.drain();
    });

    if (this.active < this.maxConcurrent && this.queue.length > 0) {
      setTimeout(() => this.drain(), 250);
    }
  }
}

export const throttle = new ApiThrottle();
