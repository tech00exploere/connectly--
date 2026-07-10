import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      default: ""
    },
    size: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Media", mediaSchema);
