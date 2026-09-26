import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { Prisma } from '@prisma/client';

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
        select: {
          id: true,
          slotId: true,
          customerName: true,
          customerEmail: true,
          status: true,
        },
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
}
