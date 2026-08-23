import { config } from "../src/bot/config";

async function setWebhook() {
  const domain = process.argv[2];
  if (!domain) {
    console.error("❌ Please provide your Vercel deployment URL.");
    console.log("Usage: npx tsx scripts/setWebhook.ts https://your-project.vercel.app");
    process.exit(1);
  }

  const cleanDomain = domain.replace(/\/$/, "");
  const webhookUrl = `${cleanDomain}/api/webhook`;
  const token = config.botToken;

  console.log(`Setting Telegram Webhook to: ${webhookUrl}`);

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
  const json = await res.json();

  console.log("Telegram API Response:", json);
  if (json.ok) {
    console.log("✅ Webhook set successfully! Your bot is now connected to Vercel & Supabase!");
  } else {
    console.error("❌ Failed to set webhook:", json.description);
  }
}

setWebhook();
