export class RegisterMobileUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly phone?: string,
    public readonly countryCode: string = '',
    public readonly phoneNumber: string = '',
  ) {}
}
