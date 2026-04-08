export class Semaphore {
  private activeCalls = 0;
  private waitQueue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {}

  acquire(): Promise<void> {
    if (this.activeCalls < this.maxConcurrent) {
      this.activeCalls++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waitQueue.push(() => {
        this.activeCalls++;
        resolve();
      });
    });
  }

  release(): void {
    this.activeCalls--;
    const next = this.waitQueue.shift();
    if (next) next();
  }
}
