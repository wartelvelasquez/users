export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static generate(): UserId {
    // Generate a UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return new UserId(uuid);
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }
}
