import { webhookCallback } from "grammy";
import { createBot } from "../src/bot";
import { db } from "../src/bot/services/db";

// Initialize Grammy bot
const bot = createBot();
const handleTelegramUpdate = webhookCallback(bot, "node:http");

export default async function handler(req: any, res: any) {
  // Health check on GET
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: "ok",
        bot: "Poland Top Universities (PTU) Telegram Bot",
        message: "Vercel Webhook is online and operational 🚀",
      })
    );
    return;
  }

  // Sync cloud database state before handling update
  try {
    await db.syncFromCloud();
  } catch (e) {
    // Non-blocking fallback
  }

  // Handle Telegram webhook update
  return handleTelegramUpdate(req, res);
}
