import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    text: {
      type: String,
      trim: true
    },

    media: {
      type: String // image/video URL
    },

    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

/* Prevent empty messages */
messageSchema.pre("validate", function (next) {
  if (!this.text && !this.media) {
    return next(new Error("Message must contain text or media"));
  }
  next();
});

export default mongoose.model("Message", messageSchema);
