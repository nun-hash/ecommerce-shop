require("dotenv").config();
const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer-core");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Function to create an HTML page rendered by MathJax
const makeHtml = (latex) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
<style>
body {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  height: 100vh;
}
#math {
  font-size: 48px;
}
</style>
</head>
<body>
  <div id="math">\\(${latex}\\)</div>
</body>
</html>
`;

async function renderLatex(latex) {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new",
  });

  const page = await browser.newPage();
  await page.setContent(makeHtml(latex), { waitUntil: "networkidle0" });
  await page.waitForSelector("svg"); // wait until MathJax finishes rendering
  const element = await page.$("svg");
  const buffer = await element.screenshot({ type: "png" });

  await browser.close();
  return buffer;
}

// /start command
bot.command("start", (ctx) =>
  ctx.reply(
    "👋 Send me LaTeX code using the `/tex` command.\n\nExample:\n`/tex \\frac{a}{b} = c`",
    { parse_mode: "Markdown" }
  )
);

// /tex command
bot.command("tex", async (ctx) => {
  const input = ctx.message.text.replace(/^\/tex(@\S+)?\s*/, "").trim();

  if (!input) {
    return ctx.reply(
      "⚠️ Please provide LaTeX code.\nExample:\n`/tex \\frac{a}{b}=c`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.replyWithChatAction("upload_photo");

  try {
    const img = await renderLatex(input);
    await ctx.replyWithPhoto({ source: img });
  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Error rendering LaTeX.");
  }
});

// Ignore plain text messages (no \tex command)
bot.on("text", async (ctx) => {
  const msg = ctx.message.text.trim();
  if (!msg.startsWith("/tex")) {
    return ctx.reply("💡 Use `/tex` to render LaTeX formulas.", {
      parse_mode: "Markdown",
    });
  }
});

bot.launch();
console.log("✅ Telegram LaTeX bot is running...");
