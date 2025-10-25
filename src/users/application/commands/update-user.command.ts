import { UpdateUserDto } from "../dtos/update-user.dto";

export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly updateData: UpdateUserDto
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }
  }

  public getUserId(): string {
    return this.userId;
  }

  public getUpdateFields(): Record<string, any> {
    const fields: Record<string, any> = {};

    if (this.updateData.firstName !== undefined) {
      fields.firstName = this.updateData.firstName;
    }
    if (this.updateData.lastName !== undefined) {
      fields.lastName = this.updateData.lastName;
    }
    if (this.updateData.phone !== undefined) {
      fields.phone = this.updateData.phone;
    }

    return fields;
  }

  public getEventPayload(): Record<string, any> {
    const payload: Record<string, any> = {};

    if (this.updateData.firstName !== undefined) {
      payload.firstName = this.updateData.firstName;
    }
    if (this.updateData.lastName !== undefined) {
      payload.lastName = this.updateData.lastName;
    }
    if (this.updateData.phone !== undefined) {
      payload.phone = this.updateData.phone;
    }

    payload.userId = this.getUserId();

    return payload;
  }

  public static fromRequest(
    userId: string,
    updateData: UpdateUserDto
  ): UpdateUserCommand {
    return new UpdateUserCommand(userId, updateData);
  }
}
