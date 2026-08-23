import { webhookCallback } from "grammy";
import { createBot } from "../src/bot";
import { db } from "../src/bot/services/db";

let handleTelegramUpdate: any = null;

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

  try {
    if (!handleTelegramUpdate) {
      const bot = createBot();
      handleTelegramUpdate = webhookCallback(bot, "http");
    }

    // Sync cloud database state before handling update
    try {
      await db.syncFromCloud();
    } catch (e) {
      // Non-blocking fallback
    }

    return await handleTelegramUpdate(req, res);
  } catch (err) {
    console.error("Vercel Webhook execution error:", err);
    if (!res.headersSent) {
      res.statusCode = 200;
      res.end("OK");
    }
  }
}
