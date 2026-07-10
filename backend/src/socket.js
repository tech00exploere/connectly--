let io;

// Map<userId, Set<socketId>> — supports multiple devices/tabs per user
export const onlineUsers = new Map();

export const initSocket = (serverIO) => {
  io = serverIO;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

/** Add a socket for a user (multi-device safe) */
export const addUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

/** Remove a specific socket; cleans up Map entry if no sockets remain */
export const removeUserSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
};

/** Returns true if the user has at least one active socket */
export const isUserOnline = (userId) =>
  onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;