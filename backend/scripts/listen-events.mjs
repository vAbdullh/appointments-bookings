// Simple Socket.IO listener to test events without a frontend.
// Usage:  node scripts/listen-events.mjs
// Requires: npm install socket.io-client  (in this directory or globally)

import { io } from 'socket.io-client';

const URL = process.env.API_URL ?? 'http://localhost:3000';

const socket = io(URL, {
  path: '/socket.io',
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`✅ Connected  id=${socket.id}  →  ${URL}`);
  console.log('Listening for slot.booked and slot.released …\n');
});

socket.on('slot.booked', (data) => {
  console.log('[slot.booked   ]', JSON.stringify(data));
});

socket.on('slot.released', (data) => {
  console.log('[slot.released ]', JSON.stringify(data));
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
