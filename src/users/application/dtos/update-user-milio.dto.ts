import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDataDto {
  @ApiProperty({
    description: 'Street address',
    example: 'calle 35 cr3aw #34-64',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Street must be a string' })
  street?: string;

  @ApiProperty({
    description: 'City name',
    example: 'Monteria',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  city?: string;

  @ApiProperty({
    description: 'Region code',
    example: 'CO-COR',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Region must be a string' })
  region?: string;

  @ApiProperty({
    description: 'Postal code',
    example: '23001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Postal code must be a string' })
  postal_code?: string;

  @ApiProperty({
    description: 'Country code',
    example: 'CO',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  country?: string;
}

export class UpdateUserMilioDto {
  @ApiProperty({
    description: 'Trade name',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Trade name must be a string' })
  tradeName?: string;

  @ApiProperty({
    description: 'Legal name',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Legal name must be a string' })
  legalName?: string;

  @ApiProperty({
    description: 'First name',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  lastName?: string;

  @ApiProperty({
    description: 'Document number',
    example: '1234567890',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Document must be a string' })
  document?: string;

  @ApiProperty({
    description: 'Type of document ID',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Type document ID must be a number' })
  typeDocumentId?: number;

  @ApiProperty({
    description: 'Verification digit',
    example: 7,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'DV must be a number' })
  dv?: number;

  @ApiProperty({
    description: 'Email for notifications',
    example: 'client.milio@yopmail.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  emailNotification?: string;

  @ApiProperty({
    description: 'Phone country code',
    example: '+57',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Indicative contact must be a string' })
  indicativeContact?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '3004990875',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone contact must be a string' })
  phoneContact?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Category ID must be a number' })
  categoryId?: number;

  @ApiProperty({
    description: 'Date of birth',
    example: '1995-12-10',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date string' })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Address data',
    type: AddressDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDataDto)
  addressData?: AddressDataDto;
}
