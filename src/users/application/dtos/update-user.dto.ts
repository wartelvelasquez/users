import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

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
}
