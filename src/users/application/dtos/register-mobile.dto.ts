import { IsEmail, IsString, MinLength, IsNotEmpty, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterMobileDto {
  @ApiProperty({
    description: 'User email (optional if phone number is provided)',
    example: 'usuario@ejemplo.com',
    required: false,
  })
  @ValidateIf((o) => !o.phone)
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'User phone number (optional if email is provided)',
    example: '+573101234567',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Please provide a valid phone number in international format' })
  phone?: string;

  @ApiProperty({
    description: 'User password',
    example: 'ContraseñaSegura123!',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
