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
  try {
    const executablePath =
      process.env.NODE_ENV === "production"
        ? "/usr/bin/chromium"
        : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    const browser = await puppeteer.launch({
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setContent(makeHtml(latex), { waitUntil: "networkidle0" });
    await page.waitForSelector("svg");
    const element = await page.$("svg");
    const buffer = await element.screenshot({ type: "png" });

    await browser.close();
    return buffer;
  } catch (error) {
    console.error("Error rendering LaTeX:", error);
    throw error;
  }
}

// Start command handler
bot.command("start", (ctx) =>
  ctx.reply(
    "👋 Welcome to LaTeX Bot!\n\n" +
      "Use the /tex command followed by your LaTeX expression to render it.\n\n" +
      "Example:\n`/tex \\frac{a}{b} = c`",
    { parse_mode: "Markdown" }
  )
);

// LaTeX command handler
bot.command("tex", async (ctx) => {
  const input = ctx.message.text.replace(/^\/tex(@\S+)?\s*/, "").trim();

  if (!input) {
    return ctx.reply(
      "⚠️ Please provide LaTeX code after the /tex command.\n\n" +
        "Example:\n`/tex \\frac{a}{b} = c`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    await ctx.replyWithChatAction("upload_photo");
    const photo = await renderLatex(input);
    await ctx.replyWithPhoto({ source: photo });
  } catch (error) {
    await ctx.reply(
      "❌ Error rendering LaTeX. Please check your syntax and try again."
    );
  }
});

// Ignore all other messages
bot.on("message", (ctx) => {
  // Silent ignore of all other messages
});

module.exports = bot;
