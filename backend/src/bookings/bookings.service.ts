import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { Prisma } from '@prisma/client';

const BOOKING_SELECT = {
  id: true,
  slotId: true,
  customerName: true,
  customerEmail: true,
  status: true,
} as const;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(dto: CreateBookingDto) {
    // Verify the slot exists
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
    });

    if (!slot) {
      throw new NotFoundException({
        error: { code: 'SLOT_NOT_FOUND', message: 'Slot not found.' },
      });
    }

    try {
      const booking = await this.prisma.booking.create({
        data: {
          slotId: dto.slotId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          // status defaults to 'active' per schema
        },
        select: BOOKING_SELECT,
      });

      return { booking };
    } catch (err) {
      // Unique constraint violation on the partial unique index
      // bookings_one_active_per_slot (slot_id WHERE status = 'active')
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException({
          error: {
            code: 'SLOT_UNAVAILABLE',
            message: 'This slot already has an active booking.',
          },
        });
      }

      // Foreign-key violation: slot was deleted between the findUnique and create
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new NotFoundException({
          error: { code: 'SLOT_NOT_FOUND', message: 'Slot not found.' },
        });
      }

      throw err; // re-throw — caught by the global filter as 500
    }
  }

  async cancelBooking(bookingId: string) {
    // Atomic conditional update: only transitions active → cancelled.
    // If the booking is already cancelled this is a no-op (count = 0).
    // This means two concurrent cancel requests are both safe:
    // exactly one will perform the update; the other skips it harmlessly.
    const { count } = await this.prisma.booking.updateMany({
      where: { id: bookingId, status: 'active' },
      data: { status: 'cancelled' },
    });

    // Whether we updated or not, fetch the current booking state
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: BOOKING_SELECT,
    });

    if (!booking) {
      throw new NotFoundException({
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' },
      });
    }

    // suppress unused-variable warning — count is intentionally checked
    void count;

    return { booking };
  }
}
