import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import connectionRoutes from "./routes/connections.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import profileRoutes from "./routes/profile.js";
import Media from "./models/Media.js";
import { initSocket, onlineUsers, addUserSocket, removeUserSocket, isUserOnline } from "./socket.js";

dotenv.config();

const app = express();

// ✅ DYNAMIC CORS (for local mobile & tunnel testing + production urls)
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const allowedOriginRegex = (process.env.CLIENT_URL_REGEX || "")
  .split(",")
  .map((pattern) => pattern.trim())
  .filter(Boolean)
  .map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed =
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.includes("192.168.") ||
      origin.includes("10.") ||
      origin.includes("172.") ||
      origin.includes("localtunnel.me") ||
      origin.includes("ngrok") ||
      allowedOrigins.includes(origin) ||
      allowedOriginRegex.some((regex) => regex.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// ✅ ROUTES
app.get("/uploads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid media id" });
    }

    const media = await Media.findById(id).select("data contentType");
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const total = media.data.length;
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

      if (start >= total || end >= total || start > end) {
        res.setHeader("Content-Range", `bytes */${total}`);
        return res.status(416).json({ message: "Requested range not satisfiable" });
      }

      const chunksize = (end - start) + 1;
      const chunk = media.data.subarray(start, end + 1);

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": media.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable"
      });
      return res.end(chunk);
    } else {
      res.setHeader("Content-Type", media.contentType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Length", media.data.length);
      return res.send(media.data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to load media" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", connectionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);

// ✅ CREATE SERVER FIRST
const server = http.createServer(app);

// ✅ SOCKET.IO (ONLY ONCE)
const io = new Server(server, {
  cors: corsOptions
});

initSocket(io);

// ✅ SOCKET AUTH (you can disable temporarily if needed)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ✅ SOCKET EVENTS
io.on("connection", (socket) => {
  const userId = socket.userId;

  addUserSocket(userId, socket.id);
  io.emit("user-online", userId);

  socket.on("typing", ({ to }) => {
    const receiverSockets = onlineUsers.get(to);
    if (receiverSockets) {
      for (const socketId of receiverSockets) {
        io.to(socketId).emit("typing", { from: userId });
      }
    }
  });

  socket.on("stop-typing", ({ to }) => {
    const receiverSockets = onlineUsers.get(to);
    if (receiverSockets) {
      for (const socketId of receiverSockets) {
        io.to(socketId).emit("stop-typing", { from: userId });
      }
    }
  });

  socket.on("disconnect", () => {
    removeUserSocket(userId, socket.id);
    // only broadcast offline if user has no remaining sockets
    if (!isUserOnline(userId)) {
      io.emit("user-offline", userId);
    }
  });
});

// ✅ SERVER START
const DEFAULT_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_RETRIES = 20;

const listenWithPortFallback = (startPort, retriesLeft = MAX_PORT_RETRIES) =>
  new Promise((resolve, reject) => {
    const onError = (error) => {
      if (error.code === "EADDRINUSE" && retriesLeft > 0) {
        const nextPort = startPort + 1;
        console.warn(`Port ${startPort} in use. Trying ${nextPort}`);
        resolve(listenWithPortFallback(nextPort, retriesLeft - 1));
        return;
      }
      reject(error);
    };

    server.once("error", onError);
    server.listen(startPort, "0.0.0.0", () => {
      server.removeListener("error", onError);
      resolve(startPort);
    });
  });

const startServer = async () => {
  await connectDB();
  try {
    const port = await listenWithPortFallback(DEFAULT_PORT);
    console.log(`Server running on port ${port}`);
  } catch (error) {
    console.error("Server failed:", error.message);
    process.exit(1);
  }
};

startServer();
