import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsPositive,
  MaxLength,
} from 'class-validator';

export enum StockAdjustmentType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

export class StockAdjustmentDto {
  @ApiProperty({
    description: 'Adjustment type',
    enum: StockAdjustmentType,
    example: StockAdjustmentType.INCREASE,
  })
  @IsEnum(StockAdjustmentType)
  type: StockAdjustmentType;

  @ApiProperty({
    description: 'Quantity to adjust',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Reason for adjustment',
    example: 'Damaged goods',
  })
  @IsString()
  @MaxLength(255)
  reason: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Items damaged during transport',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
