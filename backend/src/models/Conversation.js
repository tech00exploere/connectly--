import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    // ensures A+B and B+A are same conversation
    participantsKey: {
      type: String,
      required: true,
      unique: true
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },

    lastMessageAt: {
      type: Date
    }
  },
  { timestamps: true }
);

/* Unique conversation per user pair */
conversationSchema.index({ participantsKey: 1 }, { unique: true });

/* Ensure only 2 participants */
conversationSchema.pre("validate", function (next) {
  if (this.participants.length !== 2) {
    return next(new Error("Conversation must have exactly 2 participants"));
  }
  next();
});

export default mongoose.model("Conversation", conversationSchema);
