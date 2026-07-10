import express from "express";
import auth from "../middleware/auth.js";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import { getIO, onlineUsers } from "../socket.js";

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* DISCOVER USERS (exclude connected) */
router.get("/discover", auth, async (req, res) => {
  try {
    const me = req.user._id;

    const connections = await Connection.find({
      $or: [{ requester: me }, { recipient: me }]
    }).select("requester recipient status");

    const statusByUser = new Map();
    const connectedIds = new Set();

    for (const c of connections) {
      const otherId = c.requester.equals(me) ? c.recipient : c.requester;
      const status =
        c.status === "connected"
          ? "connected"
          : c.requester.equals(me)
          ? "pending"
          : "received";

      statusByUser.set(otherId.toString(), status);
      if (status === "connected") connectedIds.add(otherId.toString());
    }

    const users = await User.find({
      _id: { $ne: me, $nin: [...connectedIds] }
    }).select("username email profileImage institution");

    const result = users.map((u) => {
      const connectionStatus = statusByUser.get(u._id.toString()) || "none";
      return {
        ...u.toObject(),
        connectionStatus
      };
    });

    res.json(result);
  } catch (err) {
    console.error("DISCOVER ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* SEND REQUEST */
router.post("/connect/:id", auth, async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.id;

    if (!isValidId(receiver)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (sender.toString() === receiver.toString()) {
      return res.status(400).json({ message: "Cannot connect to yourself" });
    }

    const receiverUser = await User.findById(receiver).select("_id");
    if (!receiverUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = await Connection.findOne({
      $or: [
        { requester: sender, recipient: receiver },
        { requester: receiver, recipient: sender }
      ]
    });

    if (exists) {
      return res.status(400).json({ message: "Connection already exists" });
    }

    await Connection.create({
      requester: sender,
      recipient: receiver
    });

    try {
      const io = getIO();
      const receiverSocket = onlineUsers.get(receiver.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("connection-request-received", {
          senderId: sender.toString()
        });
      }
    } catch (e) {
      // socket not ready - ignore
    }

    res.json({ message: "Request sent" });
  } catch (err) {
    console.error("CONNECT ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ACCEPT REQUEST */
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const me = req.user._id;
    const sender = req.params.id;

    if (!isValidId(sender)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const connection = await Connection.findOne({
      requester: sender,
      recipient: me,
      status: "pending"
    });

    if (!connection) {
      return res.status(400).json({ message: "No request found" });
    }

    connection.status = "connected";
    connection.connectedAt = new Date();
    await connection.save();

    const ids = [me.toString(), sender.toString()].sort();
    const participantsKey = `${ids[0]}:${ids[1]}`;

    let conversation = await Conversation.findOne({ participantsKey });
    if (!conversation) {
      try {
        conversation = await Conversation.create({
          participants: [me, sender],
          participantsKey
        });
      } catch (err) {
        if (err.code === 11000) {
          conversation = await Conversation.findOne({ participantsKey });
        } else {
          throw err;
        }
      }
    }

    try {
      const io = getIO();
      const senderSocket = onlineUsers.get(sender.toString());
      if (senderSocket) {
        io.to(senderSocket).emit("connection-accepted", {
          acceptedBy: me.toString(),
          conversationId: conversation?._id || null
        });
      }
    } catch (e) {
      // socket not ready - ignore
    }

    res.json({
      message: "Connected",
      conversationId: conversation?._id || null
    });
  } catch (err) {
    console.error("ACCEPT CONNECTION ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* REJECT REQUEST */
router.post("/reject/:id", auth, async (req, res) => {
  try {
    const sender = req.params.id;
    if (!isValidId(sender)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    await Connection.deleteOne({
      requester: sender,
      recipient: req.user._id,
      status: "pending"
    });

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error("REJECT CONNECTION ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* MY CONNECTIONS (FOR MESSAGING) */
router.get("/connections", auth, async (req, res) => {
  try {
    const me = req.user._id;

    const connections = await Connection.find({
      status: "connected",
      $or: [{ requester: me }, { recipient: me }]
    }).populate("requester recipient", "username profileImage institution");

    const users = connections
      .map((c) => (c.requester._id.equals(me) ? c.recipient : c.requester))
      .filter(Boolean);

    res.json(users);
  } catch (err) {
    console.error("GET CONNECTIONS ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* MY REQUESTS */
router.get("/requests", auth, async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: "pending"
    }).populate("requester", "username profileImage institution");

    const users = requests.map((r) => r.requester).filter(Boolean);
    res.json(users);
  } catch (err) {
    console.error("GET REQUESTS ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
