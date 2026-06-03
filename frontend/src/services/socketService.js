import { io } from "socket.io-client";

// Khi chạy local (dev): dùng window.location.origin để request /socket.io
// đi qua Vite proxy -> backend:3000, tránh ERR_CONNECTION_REFUSED và CORS.
// Khi production: dùng VITE_WEBSOCKET_URL từ .env (ví dụ: https://your-api.vercel.app).
const isDev = import.meta.env.DEV;
const SOCKET_URL = isDev
  ? window.location.origin   // http://localhost:5173 -> proxy -> localhost:3000
  : import.meta.env.VITE_WEBSOCKET_URL;

// Singleton socket instance – toàn bộ app dùng chung 1 kết nối
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;

