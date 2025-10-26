/**
 * DeleteUserCommand - Comando para soft delete de usuarios
 * 
 * Este comando realiza un soft delete actualizando:
 * - deleted_at: timestamp actual
 * - status: BLOCKED
 */
export class DeleteUserCommand {
  constructor(
    public readonly userId: string,
    public readonly hardDelete: boolean = false,
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
  }

  public getUserId(): string {
    return this.userId;
  }

  public isHardDelete(): boolean {
    return this.hardDelete;
  }
}


