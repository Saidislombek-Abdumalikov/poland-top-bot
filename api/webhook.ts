import { webhookCallback } from "grammy";
import { createBot } from "../src/bot";
import { db } from "../src/bot/services/db";

// Initialize Grammy bot
const bot = createBot();
const handleTelegramUpdate = webhookCallback(bot, "std/http");

export default async function handler(req: Request) {
  // Check if health check / GET request
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "ok",
        bot: "Poland Top Universities (PTU) Telegram Bot",
        message: "Vercel Webhook is online and operational 🚀",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Sync latest cloud database state before handling update
  try {
    await db.syncFromCloud();
  } catch (e) {
    // Non-blocking fallback
  }

  // Handle Telegram webhook update
  return handleTelegramUpdate(req);
}
