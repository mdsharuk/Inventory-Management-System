import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsPositive,
  Min,
  MaxLength,
  IsDecimal,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Laptop Dell XPS 13',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-performance laptop with Intel i7 processor',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Stock Keeping Unit - unique identifier',
    example: 'DELL-XPS13-001',
  })
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiProperty({
    description: 'Product barcode',
    example: '1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiProperty({
    description: 'Selling price',
    example: 1299.99,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Cost price',
    example: 999.99,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costPrice: number;

  @ApiProperty({
    description: 'Initial stock quantity',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number = 0;

  @ApiProperty({
    description: 'Minimum stock level (reorder point)',
    example: 5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number = 0;

  @ApiProperty({
    description: 'Maximum stock level',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiProperty({
    description: 'Unit of measure',
    example: 'pcs',
    default: 'pcs',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unitOfMeasure?: string = 'pcs';

  @ApiProperty({
    description: 'Category ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  categoryId: number;

  @ApiProperty({
    description: 'Supplier ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  supplierId?: number;

  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
    default: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.ACTIVE;
}
