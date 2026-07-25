import { io, Socket } from 'socket.io-client';

// 🚀 Fixed: Hardcoded to point directly to your live Render server domain
const SOCKET_URL = 'https://onrender.com';

let socket: Socket | null = null;

export function getSocketInstance(): Socket {
  if (socket) {
    return socket;
  }

  const token = localStorage.getItem('assetflow_access_token');

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('🔌 Real-time Socket.io connected successfully');
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected. Reason:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('🔌 Socket connection error:', err.message);
  });

  return socket;
}

export function connectSocket(): void {
  const s = getSocketInstance();
  if (!s.connected) {
    const token = localStorage.getItem('assetflow_access_token');
    s.auth = { token };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocketInstance;
