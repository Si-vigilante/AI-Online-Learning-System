import { io, Socket } from 'socket.io-client';

const WS_BASE = import.meta.env.VITE_WS_BASE || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(WS_BASE, { autoConnect: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
