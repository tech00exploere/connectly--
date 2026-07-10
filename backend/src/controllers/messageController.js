import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // check if user is part of conversation
    if (
      !conversation.participants.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversation: conversationId
    })
    .populate("sender", "name username profilePicture")
    .sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

    // create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text.trim()
    });

    // update conversation last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // populate sender for frontend
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username profilePicture");

    res.json(populatedMessage);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
