export class TokenRefreshFailedEvent {
  constructor(
    public readonly refreshToken: string,
    public readonly refreshData: any,
    public readonly error: string,
    public readonly timestamp: Date = new Date()
  ) {}
}
