import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'UUID of the slot to book' })
  @IsUUID('4', { message: 'slotId must be a valid UUID' })
  slotId: string;

  @ApiProperty({ description: 'Customer full name' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'customerName must not be empty' })
  customerName: string;

  @ApiProperty({ description: 'Customer email address' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'customerEmail must be a valid email' })
  customerEmail: string;
}
