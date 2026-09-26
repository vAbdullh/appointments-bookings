import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a slot directly in the DB and return its id. */
async function createSlot(
  prisma: PrismaService,
  startsAt = new Date('2030-06-01T09:00:00Z'),
  endsAt = new Date('2030-06-01T09:30:00Z'),
): Promise<string> {
  const slot = await prisma.slot.create({
    data: { startsAt, endsAt },
  });
  return slot.id;
}

/** POST /bookings and return the parsed body. */
async function postBooking(
  app: INestApplication<App>,
  slotId: string,
  overrides: Partial<{ customerName: string; customerEmail: string }> = {},
) {
  return request(app.getHttpServer())
    .post('/bookings')
    .send({
      slotId,
      customerName: 'Alice',
      customerEmail: 'alice@example.com',
      ...overrides,
    });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('DELETE /bookings/:bookingId', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  afterEach(async () => {
    // Clean up between tests so slots are fresh
    await prisma.booking.deleteMany();
    await prisma.slot.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── 400 — invalid UUID ──────────────────────────────────────────────────
  it('returns 400 VALIDATION_ERROR for a non-UUID bookingId', async () => {
    const res = await request(app.getHttpServer()).delete('/bookings/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ── 404 — booking does not exist ────────────────────────────────────────
  it('returns 404 BOOKING_NOT_FOUND for an unknown bookingId', async () => {
    const res = await request(app.getHttpServer()).delete(
      '/bookings/00000000-0000-4000-8000-000000000000',
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
  });

  // ── 200 — cancel an active booking ──────────────────────────────────────
  it('cancels an active booking and returns 200 with status=cancelled', async () => {
    const slotId = await createSlot(prisma);
    const { body: created } = await postBooking(app, slotId);
    const bookingId = created.booking.id;

    const res = await request(app.getHttpServer()).delete(`/bookings/${bookingId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      booking: {
        id: bookingId,
        slotId,
        customerName: 'Alice',
        customerEmail: 'alice@example.com',
        status: 'cancelled',
      },
    });
  });

  // ── 200 idempotent — repeated cancellation ───────────────────────────────
  it('returns 200 with the same cancelled booking on repeated cancellation', async () => {
    const slotId = await createSlot(prisma);
    const { body: created } = await postBooking(app, slotId);
    const bookingId = created.booking.id;

    // First cancel
    const first = await request(app.getHttpServer()).delete(`/bookings/${bookingId}`);
    expect(first.status).toBe(200);
    expect(first.body.booking.status).toBe('cancelled');

    // Second cancel — must be 200 again, no changes
    const second = await request(app.getHttpServer()).delete(`/bookings/${bookingId}`);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
  });

  // ── Slot becomes available again after cancellation ──────────────────────
  it('makes the slot available again so it can be rebooked', async () => {
    const slotId = await createSlot(prisma);

    // Book it
    const { body: created } = await postBooking(app, slotId);
    const bookingId = created.booking.id;

    // Slot should NOT appear in GET /slots (it has an active booking)
    const slotsBefore = await request(app.getHttpServer()).get('/slots');
    expect(slotsBefore.body.slots.map((s: { id: string }) => s.id)).not.toContain(slotId);

    // Cancel
    await request(app.getHttpServer()).delete(`/bookings/${bookingId}`);

    // Slot should now appear in GET /slots
    const slotsAfter = await request(app.getHttpServer()).get('/slots');
    expect(slotsAfter.body.slots.map((s: { id: string }) => s.id)).toContain(slotId);

    // Rebook — must succeed with 201
    const rebook = await postBooking(app, slotId, { customerEmail: 'bob@example.com', customerName: 'Bob' });
    expect(rebook.status).toBe(201);
    expect(rebook.body.booking.slotId).toBe(slotId);
    expect(rebook.body.booking.status).toBe('active');
  });

  // ── Cancelling an old cancelled booking must NOT affect a newer active one
  it('does not affect a newer active booking when an old cancelled one is re-cancelled', async () => {
    const slotId = await createSlot(prisma);

    // First booking — book then cancel
    const { body: first } = await postBooking(app, slotId);
    const firstId = first.booking.id;
    await request(app.getHttpServer()).delete(`/bookings/${firstId}`);

    // Second booking on the same slot (slot is free again)
    const { body: second } = await postBooking(app, slotId, {
      customerName: 'Bob',
      customerEmail: 'bob@example.com',
    });
    const secondId = second.booking.id;
    expect(second.booking.status).toBe('active');

    // Re-cancel the already-cancelled first booking
    const recancel = await request(app.getHttpServer()).delete(`/bookings/${firstId}`);
    expect(recancel.status).toBe(200);
    expect(recancel.body.booking.status).toBe('cancelled');

    // The second (active) booking must still be active
    const secondCheck = await prisma.booking.findUnique({ where: { id: secondId } });
    expect(secondCheck?.status).toBe('active');
  });

  // ── Concurrent cancellation ──────────────────────────────────────────────
  it('handles concurrent cancellations safely — both return 200', async () => {
    const slotId = await createSlot(prisma);
    const { body: created } = await postBooking(app, slotId);
    const bookingId = created.booking.id;

    // Fire two cancels simultaneously
    const [r1, r2] = await Promise.all([
      request(app.getHttpServer()).delete(`/bookings/${bookingId}`),
      request(app.getHttpServer()).delete(`/bookings/${bookingId}`),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.booking.status).toBe('cancelled');
    expect(r2.body.booking.status).toBe('cancelled');
  });
});
