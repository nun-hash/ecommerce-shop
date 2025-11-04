require("dotenv").config();
const express = require("express");
const bot = require("./bot.js");
const app = express();
const PORT = process.env.PORT || 3000;

// Basic endpoint for Render health check
app.get("/", (req, res) => {
  res.send("✅ Telegram LaTeX Bot is running.");
});

// Validate BOT_TOKEN
if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is not set in environment variables!");
  process.exit(1);
}

// Start Telegram bot (polling) with error handling
bot
  .launch()
  .then(() => console.log("🤖 Bot started successfully!"))
  .catch((error) => {
    console.error("❌ Failed to start bot:", error.message);
    process.exit(1);
  });

app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
