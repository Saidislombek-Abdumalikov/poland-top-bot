import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import {
  getMainMenuKeyboard,
  getLanguageInlineKeyboard,
  getOnboardingLanguageKeyboard,
} from "../keyboards/menuKeyboards";
import { Language } from "../types";
import { escapeHtml } from "../utils/format";

export function setupStartHandler(bot: Bot) {
  // /start command
  bot.command("start", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Auto-clean user command if possible
    try {
      await ctx.deleteMessage();
    } catch {}

    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

    // Delete old prompt message if present
    if (user.lastPromptMsgId && ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, user.lastPromptMsgId);
      } catch {}
    }

    // If user is not yet registered, enforce upfront onboarding with NO menu buttons open!
    if (!user.isRegistered) {
      const welcomeText =
        `🇵🇱 <b>Welcome to Poland Top Universities (PTU)!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Your official gateway to admissions at top Polish universities.\n\n` +
        `🌐 <b>Please choose your preferred language to begin registration:</b>\n` +
        `<i>Iltimos, ro'yxatdan o'tishni boshlash uchun tilni tanlang:</i>`;

      const msg = await ctx.reply(welcomeText, {
        parse_mode: "HTML",
        reply_markup: getOnboardingLanguageKeyboard(),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    // Already registered student -> Welcome back with full menu
    const firstName = user.fullName || user.firstName || "Student";
    const welcomeMsg =
      `🇵🇱 <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>\n\n` +
      `${escapeHtml(t(user.lang, "welcome_desc"))}\n\n` +
      `👋 <b>Welcome back, ${escapeHtml(firstName)}!</b>\n` +
      `💎 Membership: <b>${escapeHtml(user.premiumTier || "Free")}</b>`;

    const msg = await ctx.reply(welcomeMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang),
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // Onboarding Step 1: Language chosen -> Edit message in-place to ask for Full Name
  bot.callbackQuery(/^onboarding_lang_(en|uz)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_lang_(en|uz)$/);
    if (!match) return;
    const chosenLang = match[1] as Language;
    const userId = ctx.from?.id;
    if (!userId) return;

    db.setLanguage(userId, chosenLang);
    db.setWaitingFor(userId, "registration_name");

    await ctx.answerCallbackQuery();

    const text =
      chosenLang === "uz"
        ? `📝 <b>1-Qadam (3 tadan): To'liq Ismingiz</b>\n\n` +
          `Iltimos, to'liq ism va familiyangizni yozib yuboring (masalan: <code>Saidislom Karimov</code>):`
        : `📝 <b>Step 1 of 3: Full Name</b>\n\n` +
          `Please reply with your Full Name (First name and Family name, e.g. <code>John Doe</code>):`;

    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
      });
      if (ctx.callbackQuery?.message) {
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
      }
    } catch {
      const msg = await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true },
      });
      db.setLastPromptMsgId(userId, msg.message_id);
    }
  });

  // /register command
  bot.command("register", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {}

    const user = db.getUser(userId);
    db.setWaitingFor(userId, "registration_name");

    const text =
      user.lang === "uz"
        ? `📝 <b>Talaba Profilini Qayta Sozlash:</b>\n\nIltimos, to'liq ism va familiyangizni kiriting:`
        : `📝 <b>Student Registration & Profile Setup:</b>\n\nPlease enter your Full Name:`;

    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true },
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // /lang command
  bot.command("lang", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {}

    const user = db.getUser(userId);

    if (!user.isRegistered) {
      const msg = await ctx.reply("⚠️ Please complete registration first.", {
        reply_markup: getOnboardingLanguageKeyboard(),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    const msg = await ctx.reply(t(user.lang, "choose_language"), {
      reply_markup: getLanguageInlineKeyboard(),
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // Language callback queries for registered users -> edit in place
  bot.callbackQuery(/^set_lang_(en|uz)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery?.data?.match(/^set_lang_(en|uz)$/);
    if (!match) return;

    const chosenLang = match[1] as Language;
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);

    db.setLanguage(userId, chosenLang);
    await ctx.answerCallbackQuery({ text: t(chosenLang, "language_set") });

    try {
      await ctx.editMessageText(`✅ ${t(chosenLang, "language_set")}`);
    } catch {}

    if (user.isRegistered) {
      await ctx.reply(`🏠 <b>${escapeHtml(t(chosenLang, "nav_main_menu"))}</b>`, {
        parse_mode: "HTML",
        reply_markup: getMainMenuKeyboard(chosenLang),
      });
    }
  });

  // Help & Info
  bot.command("help", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {}

    const user = db.getUser(userId);

    if (!user.isRegistered) {
      const msg = await ctx.reply(
        "⚠️ <b>Please complete your registration first:</b>\n\nChoose your language below to start:",
        {
          parse_mode: "HTML",
          reply_markup: getOnboardingLanguageKeyboard(),
        }
      );
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    const helpText =
      `🇵🇱 <b>Poland Top Universities (PTU) Bot Help:</b>\n\n` +
      `• /start - Open main menu\n` +
      `• /register - Update registration details\n` +
      `• /universities - Browse top Polish universities\n` +
      `• /programs - Search degree programs\n` +
      `• /nawa - NAWA document recognition guide\n` +
      `• /documents - Track application document status\n` +
      `• /exams - Practice entrance exams\n` +
      `• /premium - Activate VIP support with access code\n` +
      `• /profile - View saved programs & application status\n` +
      `• /admin - Access Admin CRM panel (for advisors)\n` +
      `• /lang - Change language (English / O'zbekcha)`;

    await ctx.reply(helpText, { parse_mode: "HTML" });
  });

  // Callback to return to main menu
  bot.callbackQuery("go_main_menu", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);

    await ctx.answerCallbackQuery();

    if (!user.isRegistered) {
      const msg = await ctx.reply(
        "⚠️ <b>Please complete your registration first:</b>",
        {
          parse_mode: "HTML",
          reply_markup: getOnboardingLanguageKeyboard(),
        }
      );
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    const firstName = user.fullName || user.firstName || "Student";
    const welcomeMsg =
      `🇵🇱 <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>\n\n` +
      `${escapeHtml(t(user.lang, "welcome_desc"))}\n\n` +
      `👋 <b>${user.lang === "uz" ? "Xush kelibsiz" : "Welcome back"}, ${escapeHtml(firstName)}!</b>\n` +
      `💎 ${user.lang === "uz" ? "A'zolik darajasi" : "Membership"}: <b>${escapeHtml(user.premiumTier || "Free")}</b>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(welcomeMsg, {
          parse_mode: "HTML",
          reply_markup: getMainMenuKeyboard(user.lang),
        });
        return;
      } catch {}
    }

    await ctx.reply(welcomeMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang),
    });
  });
}
