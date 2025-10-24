import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * DTO para actualizar usuario
 * Campos básicos del usuario que se pueden actualizar
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'First name',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+573001234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACCEPTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

