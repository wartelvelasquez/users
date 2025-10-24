export class UserLogoutEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly logoutData: any,
    public readonly timestamp: Date = new Date()
  ) {}
}
