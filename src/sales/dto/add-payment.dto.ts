import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CHECK = 'CHECK',
}

export class AddPaymentDto {
  @ApiProperty({
    description: 'Payment amount',
    example: 100.0,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.CASH;

  @ApiProperty({
    description: 'Payment date',
    example: '2025-07-22T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({
    description: 'Payment reference (transaction ID, check number, etc.)',
    example: 'TXN12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({
    description: 'Payment notes',
    example: 'Cash payment received',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
