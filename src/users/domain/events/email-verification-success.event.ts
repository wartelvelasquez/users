export class EmailVerificationSuccessEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly token: string,
    public readonly timestamp: Date = new Date()
  ) {}
}


