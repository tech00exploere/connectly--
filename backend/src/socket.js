import { Server } from "socket.io";

let io;
export const onlineUsers = new Map();

export const initSocket = (serverIO) => {
  io = serverIO;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};