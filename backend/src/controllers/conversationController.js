import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const areUsersConnected = (user, otherUserId) => {
  return user.connections.some(
    (c) =>
      c.user.toString() === otherUserId.toString() &&
      c.status === "connected"
  );
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Prevent self messaging
    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    // Get current user connections
    const currentUser = await User.findById(currentUserId).select("connections");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if users are connected
    if (!areUsersConnected(currentUser, otherUserId)) {
      return res.status(403).json({ message: "Users are not connected" });
    }

    // Generate unique conversation key
    const ids = [currentUserId.toString(), otherUserId].sort();
    const participantsKey = `${ids[0]}:${ids[1]}`;

    let conversation = await Conversation.findOne({ participantsKey });

    // Create conversation if not exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId],
        participantsKey
      });
    }

    return res.status(200).json(conversation);

  } catch (err) {
    console.error("Conversation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
