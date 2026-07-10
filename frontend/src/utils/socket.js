import { io } from "socket.io-client";
import { BACKEND_URL } from "./config";

let socket = null;

export const connectSocket = (token) => {
  socket = io(BACKEND_URL, {
    auth: { token },
    withCredentials: true
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};