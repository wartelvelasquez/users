export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone?: string,
    public readonly acceptTerms: boolean = false,
    public readonly marketingConsent: boolean = false,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly referralCode?: string,
  ) {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }
    if (!password || password.trim().length === 0) {
      throw new Error('Password is required');
    }
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    if (!acceptTerms) {
      throw new Error('Terms and conditions must be accepted');
    }
  }

  public getFullName(): string {
    return `${this.firstName.trim()} ${this.lastName.trim()}`;
  }

  public hasPhoneNumber(): boolean {
    return !!this.phone && this.phone.trim().length > 0;
  }

  public hasReferralCode(): boolean {
    return !!this.referralCode && this.referralCode.trim().length > 0;
  }

  public getMetadata(): Record<string, any> {
    return {
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      marketingConsent: this.marketingConsent,
      referralCode: this.referralCode,
      registrationSource: 'web',
      timestamp: new Date().toISOString(),
    };
  }

  public static fromRequest(request: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
    ipAddress?: string;
    userAgent?: string;
    referralCode?: string;
  }): RegisterUserCommand {
    return new RegisterUserCommand(
      request.email,
      request.password,
      request.firstName,
      request.lastName,
      request.phone,
      request.acceptTerms || false,
      request.marketingConsent || false,
      request.ipAddress,
      request.userAgent,
      request.referralCode,
    );
  }
}
