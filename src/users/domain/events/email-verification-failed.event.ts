export class EmailVerificationFailedEvent {
  constructor(
    public readonly token: string,
    public readonly error: string,
    public readonly timestamp: Date = new Date()
  ) {}
}


