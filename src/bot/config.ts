import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  botToken:
    process.env.BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    "8387916648:AAG1elnfEXLhEwtOYX1r64S52vG0AECCnK0",
  superAdminPasscode: process.env.SUPER_ADMIN_PASSCODE || "super*admin",
  advisorUsername: process.env.ADVISOR_USERNAME || "poland_admissions_bot",
  adminPasscode: process.env.ADMIN_PASSCODE || "PTUADMIN2025",
  adminIds: (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
  supabaseUrl:
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://zvdkmbxxhwtajgxpxmue.supabase.co",
  supabaseKey:
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZGttYnh4aHd0YWpneHB4bXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDg4NDAsImV4cCI6MjEwMzAyNDg0MH0.-TK8p3wrcMgt2MDfE3rszqvSc0GdZfXxlF0QtGiCGSc",
};

export function validateConfig() {
  if (!config.botToken) {
    console.warn("\n⚠️  WARNING: BOT_TOKEN is not set in environment or .env file!");
    console.warn("Please provide your Telegram Bot Token from @BotFather in .env.\n");
  }
}
