require("dotenv").config();
const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer-core");

const bot = new Telegraf(process.env.BOT_TOKEN);

// HTML page that MathJax will render
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
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setContent(makeHtml(latex), { waitUntil: "networkidle0" });
  await page.waitForSelector("svg"); // wait until MathJax renders SVG

  const element = await page.$("svg");
  const buffer = await element.screenshot({ type: "png" });

  await browser.close();
  return buffer;
}

// Command handler
bot.command("start", (ctx) =>
  ctx.reply(
    "👋 Send me LaTeX code, or use /tex <code>. Example:\n/tex \\frac{a}{b} = c"
  )
);

bot.command("tex", async (ctx) => {
  const input = ctx.message.text.replace(/^\/tex(@\S+)?\s*/, "");
  if (!input)
    return ctx.reply("Please provide LaTeX code. Example:\n/tex E=mc^2");

  await ctx.replyWithChatAction("upload_photo");
  try {
    const img = await renderLatex(input);
    await ctx.replyWithPhoto({ source: img });
  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Error rendering LaTeX.");
  }
});

// Fallback: any plain message
bot.on("text", async (ctx) => {
  const input = ctx.message.text;
  await ctx.replyWithChatAction("upload_photo");
  try {
    const img = await renderLatex(input);
    await ctx.replyWithPhoto({ source: img });
  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Error rendering.");
  }
});

module.exports = bot;
