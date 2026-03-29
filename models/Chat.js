const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  title: {
    type: String,
    default: "New Chat"
  },

  messages: [
    {
      role: String, 
      content: String
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);