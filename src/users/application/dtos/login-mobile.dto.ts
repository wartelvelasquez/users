import { IsString, IsNotEmpty, Matches, IsEmail, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginMobileDto {
  @ApiProperty({
    description: 'User phone number (optional if email is provided)',
    example: '+1234567890',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Please provide a valid phone number in international format' })
  phone?: string;

  @ApiProperty({
    description: 'User email (optional if phone number is provided)',
    example: 'user@example.com',
    required: false,
  })
  @ValidateIf((o) => !o.phone)
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
