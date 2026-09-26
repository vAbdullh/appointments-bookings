import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'UUID v4 of the slot to book.',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'slotId must be a valid UUID' })
  slotId: string;

  @ApiProperty({
    description: 'Full name of the customer. Leading/trailing whitespace is trimmed before validation.',
    example: 'Alice Smith',
    minLength: 1,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'customerName must not be empty' })
  customerName: string;

  @ApiProperty({
    description: 'Email address of the customer. Leading/trailing whitespace is trimmed before validation.',
    example: 'alice@example.com',
    format: 'email',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail({}, { message: 'customerEmail must be a valid email' })
  customerEmail: string;
}
