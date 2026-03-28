const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.get("/register", auth.registerGet);
router.post("/register", auth.registerPost);

router.get("/login", auth.loginGet);
router.post("/login", auth.loginPost);

router.get("/logout", auth.logout);

module.exports = router;