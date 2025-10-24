import { UserId } from '../value-objects/user-id.vo';

export class Role {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _permissions: string[] = [],
    private readonly _description?: string,
    private readonly _createdAt: Date = new Date(),
    private readonly _updatedAt: Date = new Date(),
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get permissions(): string[] {
    return [...this._permissions];
  }

  get description(): string | undefined {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Domain methods
  public hasPermission(permission: string): boolean {
    return this._permissions.includes(permission);
  }

  public addPermission(permission: string): void {
    if (!this._permissions.includes(permission)) {
      this._permissions.push(permission);
    }
  }

  public removePermission(permission: string): void {
    const index = this._permissions.indexOf(permission);
    if (index > -1) {
      this._permissions.splice(index, 1);
    }
  }

  // Factory methods
  static create(
    name: string,
    permissions: string[] = [],
    description?: string,
    id?: string,
  ): Role {
    return new Role(
      id || UserId.generate().value,
      name,
      permissions,
      description,
    );
  }

  static fromPersistence(
    id: string,
    name: string,
    permissions: string[],
    description?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Role {
    return new Role(
      id,
      name,
      permissions,
      description,
      createdAt,
      updatedAt,
    );
  }
}
