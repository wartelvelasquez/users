export class ConfirmEmailVerificationCommand {
  constructor(
    public readonly token: string,
  ) {
    if (!token || token.trim().length === 0) {
      throw new Error('Verification token is required');
    }
  }
  // Token format is "email_verification_userId_timestamp_randomString"
  public getTokenParts(): string[] {
    return this.token.split('_');
  }

  public getUserId(): string {
    const parts = this.getTokenParts();
    if (parts.length >= 3) {
      return parts[2];
    }
    throw new Error('Invalid token format: cannot extract user ID');
  }

  public getTimestamp(): string {
    const parts = this.getTokenParts();
    if (parts.length >= 4) {
      return parts[3];
    }
    throw new Error('Invalid token format: cannot extract timestamp');
  }

  public isValidFormat(): boolean {
    const parts = this.getTokenParts();
    return parts.length >= 4 && 
           parts[0] === 'email' && 
           parts[1] === 'verification';
  }

  public static fromToken(token: string): ConfirmEmailVerificationCommand {
    return new ConfirmEmailVerificationCommand(token);
  }
}
