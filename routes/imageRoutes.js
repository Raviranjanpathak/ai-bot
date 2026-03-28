const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const image = require("../controllers/imageControllers");

router.post("/analyze-image", upload.single("image"), image.analyzeImage);

module.exports = router;