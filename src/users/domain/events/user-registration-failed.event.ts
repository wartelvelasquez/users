export class UserRegistrationFailedEvent {
  constructor(
    public readonly email: string,
    public readonly userData: any,
    public readonly error: string,
    public readonly timestamp: Date = new Date()
  ) {}
}


