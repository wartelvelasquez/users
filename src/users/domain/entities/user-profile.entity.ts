export class UserProfile {
  private readonly _firstName: string;
  private readonly _lastName: string;

  constructor(firstName: string, lastName: string) {
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    
    this._firstName = firstName.trim();
    this._lastName = lastName.trim();
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get initials(): string {
    return `${this._firstName.charAt(0)}${this._lastName.charAt(0)}`.toUpperCase();
  }

  equals(other: UserProfile): boolean {
    return this._firstName === other._firstName && this._lastName === other._lastName;
  }

  updateFirstName(newFirstName: string): UserProfile {
    return new UserProfile(newFirstName, this._lastName);
  }

  updateLastName(newLastName: string): UserProfile {
    return new UserProfile(this._firstName, newLastName);
  }

  updateNames(newFirstName: string, newLastName: string): UserProfile {
    return new UserProfile(newFirstName, newLastName);
  }

  static fromPersistence(data: { firstName: string; lastName: string }): UserProfile {
    return new UserProfile(data.firstName, data.lastName);
  }

  toPersistence(): { firstName: string; lastName: string } {
    return {
      firstName: this._firstName,
      lastName: this._lastName,
    };
  }
}
