export class UserValidationSuccessEvent {
  constructor(
    public readonly userId: string,
    public readonly validationData: any,
    public readonly timestamp: Date = new Date()
  ) {}
}
