import { AggregateRoot } from '@nestjs/cqrs';
import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { PersonName } from '../value-objects/person-name.vo';
import { Phone } from '../value-objects/phone.vo';
import { RoleId } from '../value-objects/role-id.vo';
import { Role } from './role.entity';

export enum UserStatus {
  ACCEPTED = 'ACCEPTED',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserProps {
  id: UserId;
  email: Email;
  password: Password;
  firstName: PersonName;
  lastName: PersonName;
  phone?: Phone;
  roles: Role[];
  status: UserStatus;
  lastLoginAt?: Date;
  roleId?: RoleId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: Email;
  password: Password;
  firstName: PersonName;
  lastName: PersonName;
  phone?: Phone;
  id?: UserId;
}

export interface UpdateProfileProps {
  firstName?: PersonName;
  lastName?: PersonName;
  phone?: Phone;
  email?: Email;
}


export class User extends AggregateRoot {
  private constructor(private readonly props: UserProps) {
    super();
  }

  // Getters
  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get firstName(): PersonName {
    return this.props.firstName;
  }

  get lastName(): PersonName {
    return this.props.lastName;
  }

  get fullName(): string {
    return PersonName.getFullName(this.props.firstName, this.props.lastName);
  }

  get phone(): Phone | undefined {
    return this.props.phone;
  }

  get roles(): Role[] {
    return [...this.props.roles];
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get roleId(): RoleId | undefined {
    return this.props.roleId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  public activate(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new Error('Cannot activate suspended user');
    }
    this.props.status = UserStatus.ACCEPTED;
    this.touch();
  }

  public deactivate(): void {
    this.props.status = UserStatus.INACTIVE;
    this.touch();
  }

  public suspend(): void {
    this.props.status = UserStatus.SUSPENDED;
    this.touch();
  }

  public verifyEmail(): void {
    if (this.props.status === UserStatus.PENDING_VERIFICATION) {
      this.props.status = UserStatus.ACCEPTED;
    }
    this.touch();
  }

  public changePassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.touch();
  }

  public updateProfile(profile: UpdateProfileProps): void {
    if (profile.firstName) {
      this.props.firstName = profile.firstName;
    }
    if (profile.lastName) {
      this.props.lastName = profile.lastName;
    }
    if (profile.phone !== undefined) {
      this.props.phone = profile.phone;
    }
    if (profile.email) {
      this.props.email = profile.email;
    }
    this.touch();
  }

  public updateEmail(email: Email): void {
    this.props.email = email;
    this.touch();
  }

  public assignRole(role: Role): void {
    if (this.hasRole(role.id)) {
      throw new Error(`User already has role: ${role.name}`);
    }
    this.props.roles.push(role);
    this.touch();
  }

  public removeRole(roleId: string): void {
    const index = this.props.roles.findIndex(role => role.id === roleId);
    if (index === -1) {
      throw new Error('User does not have this role');
    }
    this.props.roles.splice(index, 1);
    this.touch();
  }

  public hasRole(roleId: string): boolean {
    return this.props.roles.some(role => role.id === roleId);
  }

  public hasPermission(permission: string): boolean {
    return this.props.roles.some(role => role.hasPermission(permission));
  }

  public getAllPermissions(): string[] {
    const permissions = new Set<string>();
    this.props.roles.forEach(role => {
      role.permissions.forEach(permission => permissions.add(permission));
    });
    return Array.from(permissions);
  }

  public updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    this.touch();
  }

  public isActive(): boolean {
    return this.props.status === UserStatus.ACCEPTED;
  }

  public canLogin(): boolean {
    return this.isActive();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // Event Sourcing methods
  public apply(event: any): void {
    // Agregado para Event Sourcing - puedes expandir según necesites
  }

  public markEventsAsCommitted(): void {
    // Agregado para Event Sourcing - marca eventos como committed
  }

  public getUncommittedEvents(): any[] {
    // Agregado para Event Sourcing - retorna eventos sin commit
    return [];
  }

  // Factory methods
  public static create(createProps: CreateUserProps): User {
    const now = new Date();
    const user = new User({
      id: createProps.id || UserId.generate(),
      email: createProps.email,
      password: createProps.password,
      firstName: createProps.firstName,
      lastName: createProps.lastName,
      phone: createProps.phone,
      roles: [],
      status: UserStatus.ACCEPTED,
      createdAt: now,
      updatedAt: now,
    });

    return user;
  }

  // Método de compatibilidad con la entidad de auth
  public static createSimple(
    email: Email,
    password: Password,
    firstName: PersonName,
    lastName: PersonName,
    phone?: Phone,
    id?: UserId,
  ): User {
    const user = User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      id,
    });
    return user;
  }

  public static fromPersistence(
    id: string,
    email: string,
    hashedPassword: string,
    firstName: string,
    lastName: string,
    phone?: string,
    roles: Role[] = [],
    status: UserStatus = UserStatus.PENDING_VERIFICATION,
    lastLoginAt?: Date,
    roleId?: string,
    createdAt?: string,
    updatedAt?: string,
  ): User {
    return new User({
      id: UserId.fromString(id),
      email: Email.fromString(email),
      password: Password.fromHash(hashedPassword),
      firstName: PersonName.fromPersistence(firstName),
      lastName: PersonName.fromPersistence(lastName),
      phone: Phone.fromPersistenceOptional(phone),
      roles,
      status,
      lastLoginAt,
      roleId: RoleId.fromStringOptional(roleId),
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    });
  }

  public toPersistence(): any {
    return {
      id: this.props.id.value,
      email: this.props.email.value,
      password: this.props.password.value,
      firstName: this.props.firstName.value,
      lastName: this.props.lastName.value,
      phone: this.props.phone?.value,
      status: this.props.status,
      lastLoginAt: this.props.lastLoginAt,
      role_id: this.props.roleId?.value,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
