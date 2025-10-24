export class PhoneLoginSuccessEvent {
  constructor(
    public readonly userId: string,
    public readonly phone: string,
    public readonly loginData: any,
    public readonly timestamp: Date = new Date()
  ) {}
}


