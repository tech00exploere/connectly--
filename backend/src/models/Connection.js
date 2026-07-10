import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "connected"],
      default: "pending"
    },

    connectedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

/* Prevent duplicate connections */
connectionSchema.index(
  { requester: 1, recipient: 1 },
  { unique: true }
);

/* Prevent reverse duplicates */
connectionSchema.index(
  { recipient: 1, requester: 1 },
  { unique: true }
);

/* Prevent self connection */
connectionSchema.pre("save", function (next) {
  if (this.requester.equals(this.recipient)) {
    return next(new Error("Cannot connect to yourself"));
  }

  if (this.status === "connected" && !this.connectedAt) {
    this.connectedAt = new Date();
  }

  next();
});

export default mongoose.model("Connection", connectionSchema);
