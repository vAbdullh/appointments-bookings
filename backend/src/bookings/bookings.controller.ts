import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { validate as isUuid } from 'uuid';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a booking for a slot' })
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }

  @Delete(':bookingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active booking' })
  cancelBooking(@Param('bookingId') bookingId: string) {
    if (!isUuid(bookingId)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'bookingId must be a valid UUID.',
        },
      });
    }
    return this.bookingsService.cancelBooking(bookingId);
  }
}
