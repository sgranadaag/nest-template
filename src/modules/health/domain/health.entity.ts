export class Health {
  private constructor(
    private readonly status: string,
    private readonly uptime: number,
    private readonly timestamp: Date,
  ) {}

  static create(uptime: number): Health {
    return new Health('ok', uptime, new Date());
  }

  getStatus(): string {
    return this.status;
  }

  getUptime(): number {
    return this.uptime;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }
}
