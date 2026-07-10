import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    if (file.mimetype.startsWith("video/")) return cb(null, true);
    return cb(new Error("Only images and videos allowed"));
  },
  limits: { fileSize: 14 * 1024 * 1024 }
});

export default upload;
