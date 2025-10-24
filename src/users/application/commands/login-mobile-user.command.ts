export class LoginMobileUserCommand {
  constructor(
    public readonly password: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly countryCode?: string,
    public readonly phoneNumber?: string,
  ) {}
}
