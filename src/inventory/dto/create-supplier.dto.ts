import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Supplier name',
    example: 'Tech Solutions Inc.',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Supplier email address',
    example: 'contact@techsolutions.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Supplier phone number',
    example: '+1-555-0123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    description: 'Supplier address',
    example: '123 Business St, City, State 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    description: 'Contact person name',
    example: 'John Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPerson?: string;
}
