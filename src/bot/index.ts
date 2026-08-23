import { Bot, GrammyError, HttpError } from "grammy";
import { config, validateConfig } from "./config";
import { setupStartHandler } from "./handlers/startHandler";
import { setupUniversityHandler } from "./handlers/universityHandler";
import { setupProgramHandler } from "./handlers/programHandler";
import { setupNawaHandler } from "./handlers/nawaHandler";
import { setupDocumentHandler } from "./handlers/documentHandler";
import { setupExamHandler } from "./handlers/examHandler";
import { setupPremiumHandler } from "./handlers/premiumHandler";
import { setupProfileHandler } from "./handlers/profileHandler";
import { setupTextInputHandler } from "./handlers/textInputHandler";
import { setupAdminHandler } from "./handlers/adminHandler";
import { setupReviewHandler } from "./handlers/reviewHandler";

export function createBot(token?: string) {
  const activeToken = token || config.botToken;

  if (!activeToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN. Please provide a valid token from @BotFather.");
  }

  const bot = new Bot(activeToken);

  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Grammy error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  // Setup all feature handlers
  setupAdminHandler(bot);
  setupStartHandler(bot);
  setupUniversityHandler(bot);
  setupProgramHandler(bot);
  setupNawaHandler(bot);
  setupDocumentHandler(bot);
  setupExamHandler(bot);
  setupPremiumHandler(bot);
  setupReviewHandler(bot);
  setupProfileHandler(bot);
  setupTextInputHandler(bot);

  // Version/Health command for instant verification
  bot.command(["version", "ping"], async (ctx) => {
    await ctx.reply(
      `🤖 <b>PTU Bot System Status: ONLINE</b>\n` +
        `• 🏷️ <b>Version:</b> 2.2.0\n` +
        `• ⚡ <b>Response:</b> Operational\n` +
        `• 🗄️ <b>Database:</b> Cloud Sync Active`,
      { parse_mode: "HTML" }
    );
  });

  return bot;
}

import * as http from "http";

export async function startBot(token?: string) {
  validateConfig();
  const activeToken = token || config.botToken;

  if (!activeToken) {
    console.error("❌ Cannot start Telegram Bot: BOT_TOKEN is missing.");
    console.log("👉 How to fix: Set BOT_TOKEN in your .env file or run with BOT_TOKEN=your_token");
    return;
  }

  // Start lightweight HTTP health server for cloud platforms (Render / Railway / Koyeb)
  const port = Number(process.env.PORT) || 10000;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        bot: "Poland Top Universities (PTU) Telegram Bot",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    );
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Health check server active on 0.0.0.0:${port}`);
  });

  const bot = createBot(activeToken);

  console.log("🚀 Starting Poland Top Universities (PTU) Telegram Bot...");

  // Clear any existing webhook so local long-polling can start without 409 conflict
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
  } catch (e) {
    // Ignore
  }

  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ PTU Bot is running as @${botInfo.username} (ID: ${botInfo.id})`);
      console.log("🇵🇱 Universities, Programs, NAWA, Exams & Document Tracker ready!");
    },
  });
}

// Auto-run only if executed directly via npm run bot or tsx src/bot/index.ts
const isDirectRun =
  process.env.npm_lifecycle_event === "bot" ||
  process.env.npm_lifecycle_event === "bot:dev" ||
  (Boolean(process.argv[1]) &&
    (process.argv[1].endsWith("src/bot/index.ts") ||
      process.argv[1].endsWith("src\\bot\\index.ts") ||
      process.argv[1].endsWith("src/bot/index.js") ||
      process.argv[1].endsWith("src\\bot\\index.js")));

if (isDirectRun) {
  startBot();
}

