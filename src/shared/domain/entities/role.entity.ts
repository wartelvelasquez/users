export class Role {
  constructor(
    private readonly _id: string,
    private _name: string,
    private _description: string,
    private _permissions: string[] = [],
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get permissions(): string[] {
    return [...this._permissions];
  }

  hasPermission(permission: string): boolean {
    return this._permissions.includes(permission);
  }

  addPermission(permission: string): void {
    if (!this._permissions.includes(permission)) {
      this._permissions.push(permission);
    }
  }

  removePermission(permission: string): void {
    const index = this._permissions.indexOf(permission);
    if (index > -1) {
      this._permissions.splice(index, 1);
    }
  }

  static create(
    id: string,
    name: string,
    description: string,
    permissions: string[] = [],
  ): Role {
    return new Role(id, name, description, permissions);
  }
}
