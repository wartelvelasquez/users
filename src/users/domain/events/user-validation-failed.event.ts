export class UserValidationFailedEvent {
  constructor(
    public readonly userId: string,
    public readonly validationData: any,
    public readonly error: string,
    public readonly timestamp: Date = new Date()
  ) {}
}
