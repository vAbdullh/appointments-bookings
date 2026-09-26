import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  // Share the existing HTTP server — no separate port
  cors: { origin: '*' },
  path: '/socket.io',
  namespace: '/',
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  emitSlotBooked(slotId: string, bookingId: string) {
    this.server.emit('slot.booked', { slotId, bookingId, available: false });
  }

  emitSlotReleased(slotId: string, bookingId: string) {
    this.server.emit('slot.released', { slotId, bookingId, available: true });
  }
}
