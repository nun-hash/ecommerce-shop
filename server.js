require("dotenv").config();
const express = require("express");
const bot = require("./bot.js");
const app = express();
const PORT = process.env.PORT || 3000;

// Basic endpoint for Render health check
app.get("/", (req, res) => {
  res.send("✅ Telegram LaTeX Bot is running.");
});

// Start Telegram bot (polling)
bot.launch().then(() => console.log("🤖 Bot started!"));

app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
