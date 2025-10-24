export class TokenRefreshSuccessEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly refreshData: any,
    public readonly timestamp: Date = new Date()
  ) {}
}
