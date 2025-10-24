export class UserLoginFailedEvent {
  constructor(
    public readonly email: string,
    public readonly loginData: any,
    public readonly error: string,
    public readonly timestamp: Date = new Date()
  ) {}
}


