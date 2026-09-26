import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';

describe('Bookings API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicate main.ts configuration
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    // Clean up data between tests
    await prisma.booking.deleteMany();
    await prisma.slot.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createSlot(startsAt = new Date('2030-01-01T10:00:00Z'), endsAt = new Date('2030-01-01T10:30:00Z')) {
    return prisma.slot.create({ data: { startsAt, endsAt } });
  }

  describe('Booking and Slot Availability', () => {
    it('returns 201 on success and hides the slot from GET /slots', async () => {
      const slot = await createSlot();

      // Ensure slot is initially available
      const slotsBefore = await request(app.getHttpServer()).get('/slots');
      expect(slotsBefore.body.slots).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: slot.id })])
      );

      // Create booking
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          slotId: slot.id,
          customerName: 'Alice',
          customerEmail: 'alice@example.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.booking.slotId).toBe(slot.id);
      expect(res.body.booking.status).toBe('active');

      // Ensure slot is no longer available
      const slotsAfter = await request(app.getHttpServer()).get('/slots');
      expect(slotsAfter.body.slots).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: slot.id })])
      );
    });

    it('handles concurrent requests safely (one 201, one 409)', async () => {
      const slot = await createSlot();

      // Send two booking requests concurrently
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer()).post('/bookings').send({
          slotId: slot.id,
          customerName: 'Alice',
          customerEmail: 'alice@example.com',
        }),
        request(app.getHttpServer()).post('/bookings').send({
          slotId: slot.id,
          customerName: 'Bob',
          customerEmail: 'bob@example.com',
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);

      // Exactly one active booking exists
      const activeBookings = await prisma.booking.count({
        where: { slotId: slot.id, status: 'active' },
      });
      expect(activeBookings).toBe(1);
    });
  });

  describe('Cancellation', () => {
    it('returns 200, restores availability, and allows rebooking', async () => {
      const slot = await createSlot();
      const bookingRes = await request(app.getHttpServer()).post('/bookings').send({
        slotId: slot.id,
        customerName: 'Alice',
        customerEmail: 'alice@example.com',
      });
      const bookingId = bookingRes.body.booking.id;

      // Cancel booking
      const cancelRes = await request(app.getHttpServer()).delete(`/bookings/${bookingId}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.booking.status).toBe('cancelled');

      // Slot should be available again
      const slotsAfter = await request(app.getHttpServer()).get('/slots');
      expect(slotsAfter.body.slots).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: slot.id })])
      );

      // Rebook
      const rebookRes = await request(app.getHttpServer()).post('/bookings').send({
        slotId: slot.id,
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
      });
      expect(rebookRes.status).toBe(201);
      expect(rebookRes.body.booking.status).toBe('active');
    });

    it('returns same cancelled booking on repeated cancellation without affecting a newer booking', async () => {
      const slot = await createSlot();
      const bookingRes = await request(app.getHttpServer()).post('/bookings').send({
        slotId: slot.id,
        customerName: 'Alice',
        customerEmail: 'alice@example.com',
      });
      const firstBookingId = bookingRes.body.booking.id;

      // Cancel first booking
      const cancel1 = await request(app.getHttpServer()).delete(`/bookings/${firstBookingId}`);
      expect(cancel1.status).toBe(200);

      // Rebook
      const rebookRes = await request(app.getHttpServer()).post('/bookings').send({
        slotId: slot.id,
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
      });
      const secondBookingId = rebookRes.body.booking.id;

      // Cancel first booking again (repeated)
      const cancel2 = await request(app.getHttpServer()).delete(`/bookings/${firstBookingId}`);
      expect(cancel2.status).toBe(200);
      expect(cancel2.body.booking).toEqual(cancel1.body.booking);

      // Ensure second booking is unaffected
      const checkSecond = await prisma.booking.findUnique({ where: { id: secondBookingId } });
      expect(checkSecond?.status).toBe('active');
    });
  });
});
