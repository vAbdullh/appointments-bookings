import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { SlotsModule } from './slots/slots.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { EventsModule } from './events/events.module.js';

@Module({
  imports: [PrismaModule, EventsModule, SlotsModule, BookingsModule],
})
export class AppModule {}
