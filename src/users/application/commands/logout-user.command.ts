export class LogoutUserCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly logoutData: any,
  ) {}
}
