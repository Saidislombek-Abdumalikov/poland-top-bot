import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "",
  advisorUsername: process.env.ADVISOR_USERNAME || "poland_admissions_bot",
  adminPasscode: process.env.ADMIN_PASSCODE || "PTUADMIN2025",
  adminIds: (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
};

export function isAdminUser(userId: number): boolean {
  if (config.adminIds.includes(userId)) return true;
  return false;
}

export function validateConfig() {
  if (!config.botToken) {
    console.warn("\n⚠️  WARNING: BOT_TOKEN is not set in environment or .env file!");
    console.warn("Please provide your Telegram Bot Token from @BotFather in .env.\n");
  }
}
