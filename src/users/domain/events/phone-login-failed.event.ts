export class PhoneLoginFailedEvent {
  constructor(
    public readonly phone: string,
    public readonly loginData: any,
    public readonly error: string,
    public readonly timestamp: Date = new Date()
  ) {}
}


