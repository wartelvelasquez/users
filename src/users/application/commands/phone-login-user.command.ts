export class PhoneLoginUserCommand {
  constructor(
    public readonly password: string,
    public readonly phone: string,
  ) {}
}
