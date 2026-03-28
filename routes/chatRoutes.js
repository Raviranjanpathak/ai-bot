const express = require("express");
const router = express.Router();
const chat = require("../controllers/chatController");

router.post("/chat", chat.chat);
router.post("/new-chat", chat.newChat);
router.get("/chats", chat.getChats);
router.delete("/delete-chat/:id", chat.deleteChat);

module.exports = router;