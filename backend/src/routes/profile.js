import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import User from "../models/User.js";
import Media from "../models/Media.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("PROFILE GET ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/", auth, upload.single("image"), async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ["username", "institution", "qualification", "dob", "gender", "resume"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.name !== undefined) {
      updates.username = req.body.name;
    }

    if (req.file) {
      const media = await Media.create({
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname || "",
        size: req.file.size
      });
      updates.profileImage = `/uploads/${media._id}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


