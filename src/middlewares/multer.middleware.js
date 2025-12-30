import multer from "multer";
import path from "path";

// Multer storage configuration
const storage = multer.diskStorage({
  // Where to store files temporarily
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // temp folder
  },

  // How file name should be saved
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1E9);

    cb(
      null,
      file.originalname
    );
  },
});

// Multer middleware
export const upload = multer({
  storage,
});
