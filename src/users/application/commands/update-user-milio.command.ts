import { UpdateUserMilioDto } from "../dtos/update-user-milio.dto";

export class UpdateUserMilioCommand {
  constructor(
    public readonly userId: string,
    public readonly updateData: UpdateUserMilioDto
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }
  }

  public hasTradeName(): boolean {
    return (
      !!this.updateData.tradeName && this.updateData.tradeName.trim().length > 0
    );
  }

  public hasLegalName(): boolean {
    return (
      !!this.updateData.legalName && this.updateData.legalName.trim().length > 0
    );
  }

  public hasDocument(): boolean {
    return (
      !!this.updateData.document && this.updateData.document.trim().length > 0
    );
  }

  public hasAddressData(): boolean {
    return !!this.updateData.addressData;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getUpdateFields(): Record<string, any> {
    const fields: Record<string, any> = {};

    if (this.updateData.tradeName !== undefined) {
      fields.tradeName = this.updateData.tradeName;
    }
    if (this.updateData.legalName !== undefined) {
      fields.legalName = this.updateData.legalName;
    }
    if (this.updateData.name !== undefined) {
      fields.firstName = this.updateData.name;
    }
    if (this.updateData.lastName !== undefined) {
      fields.lastName = this.updateData.lastName;
    }
    if (this.updateData.document !== undefined) {
      fields.document = String(this.updateData.document);
    }
    if (this.updateData.typeDocumentId !== undefined) {
      fields.typeDocumentId = this.updateData.typeDocumentId;
    }
    if (this.updateData.dv !== undefined) {
      fields.dv = this.updateData.dv;
    }
    if (this.updateData.emailNotification !== undefined) {
      fields.emailNotification = this.updateData.emailNotification;
      fields.email = this.updateData.emailNotification;
    }
    if (this.updateData.indicativeContact !== undefined) {
      fields.indicativeContact = this.updateData.indicativeContact;
      fields.countryCode = this.updateData.indicativeContact;
    }
    if (this.updateData.phoneContact !== undefined) {
      fields.phone = String(this.updateData.phoneContact);
      fields.phoneNumber = String(this.updateData.phoneContact);
    }
    if (this.updateData.categoryId !== undefined) {
      fields.categoryId = this.updateData.categoryId;
    }
    if (this.updateData.dateOfBirth !== undefined) {
      fields.date_of_birth = this.updateData.dateOfBirth;
    }
    if (this.updateData.addressData !== undefined) {
      const addressData = { ...this.updateData.addressData };
      if (addressData.postal_code !== undefined) {
        addressData.postal_code = String(addressData.postal_code);
      }
      fields.addressData = addressData;
    }

    return fields;
  }

  public getEventPayload(): Record<string, any> {
    const payload: Record<string, any> = {};

    // Mantener los nombres originales del DTO para el evento de Kafka
    if (this.updateData.tradeName !== undefined) {
      payload.tradeName = this.updateData.tradeName;
    }
    if (this.updateData.legalName !== undefined) {
      payload.legalName = this.updateData.legalName;
    }
    if (this.updateData.name !== undefined) {
      payload.name = this.updateData.name;
    }
    if (this.updateData.lastName !== undefined) {
      payload.lastName = this.updateData.lastName;
    }
    if (this.updateData.document !== undefined) {
      payload.document = this.updateData.document;
    }
    if (this.updateData.typeDocumentId !== undefined) {
      payload.typeDocumentId = this.updateData.typeDocumentId;
    }
    if (this.updateData.dv !== undefined) {
      payload.dv = this.updateData.dv;
    }
    if (this.updateData.emailNotification !== undefined) {
      payload.emailNotification = this.updateData.emailNotification;
    }
    if (this.updateData.indicativeContact !== undefined) {
      payload.indicativeContact = this.updateData.indicativeContact;
    }
    if (this.updateData.phoneContact !== undefined) {
      payload.phoneContact = this.updateData.phoneContact;
    }
    if (this.updateData.categoryId !== undefined) {
      payload.categoryId = this.updateData.categoryId;
    }
    if (this.updateData.dateOfBirth !== undefined) {
      payload.dateOfBirth = this.updateData.dateOfBirth;
    }
    if (this.updateData.addressData !== undefined) {
      payload.addressData = this.updateData.addressData;
    }

    payload.userId = this.getUserId();

    return payload;
  }

  public static fromRequest(
    userId: string,
    updateData: UpdateUserMilioDto
  ): UpdateUserMilioCommand {
    return new UpdateUserMilioCommand(userId, updateData);
  }
}
