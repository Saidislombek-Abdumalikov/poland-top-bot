import { Bot, Context, InlineKeyboard } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import {
  getMainMenuKeyboard,
  getLanguageInlineKeyboard,
  getOnboardingLanguageKeyboard,
  getOnboardingDegreeKeyboard,
  getPhoneRequestKeyboard,
  getOfertaKeyboard,
} from "../keyboards/menuKeyboards";
import { Language } from "../types";
import { escapeHtml } from "../utils/format";

export function setupStartHandler(bot: Bot) {
  // /start command
  bot.command("start", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

    // Handle deep-linked promo code (e.g. /start promo_K7X9P2LM or /start K7X9P2LM)
    const startPayload = ctx.match ? ctx.match.toString().trim() : "";
    if (startPayload) {
      const candidateCode = startPayload.replace(/^promo_/, "").toUpperCase().trim();
      const maybePromo = db.getPromoCode(candidateCode);
      if (maybePromo && maybePromo.isActive && !maybePromo.isExpired) {
        db.redeemPromoCode(candidateCode, userId);
      }
    }

    // If user is not yet registered, guide them to their current onboarding step without flickering!
    if (!user.isRegistered) {
      const isUz = user.lang === "uz";

      // 1. If info is complete, show Oferta with [ ✅ Roziman ]
      if (user.fullName && user.phone && user.preferredLevel) {
        db.setWaitingFor(userId, "waiting_oferta_acceptance");
        const renderedOferta = db.getRenderedOferta();
        const ofertaMessage = isUz
          ? `📋 <b>Sizning Ma'lumotlaringiz:</b>\n` +
            `• 👤 <b>Ism:</b> ${escapeHtml(user.fullName)}\n` +
            `• 📞 <b>Telefon:</b> ${escapeHtml(user.phone)}\n` +
            `• 🎓 <b>Ta'lim Bosqichi:</b> ${escapeHtml(user.preferredLevel)}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `${renderedOferta}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `👇 <b>Botdan to'liq foydalanishni boshlash uchun Ofertani qabul qiling va "✅ Roziman" tugmasini bosing:</b>`
          : `📋 <b>Your Profile Summary:</b>\n` +
            `• 👤 <b>Name:</b> ${escapeHtml(user.fullName)}\n` +
            `• 📞 <b>Phone:</b> ${escapeHtml(user.phone)}\n` +
            `• 🎓 <b>Target Degree:</b> ${escapeHtml(user.preferredLevel)}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `${renderedOferta}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `👇 <b>To unlock the bot and begin, please read the Terms above and tap "✅ I Agree":</b>`;

        const msg = await ctx.reply(ofertaMessage, {
          parse_mode: "HTML",
          reply_markup: getOfertaKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // 2. If name is entered and waiting for phone -> Show phone request button
      if (user.fullName && !user.phone) {
        db.setWaitingFor(userId, "registration_phone");
        const phonePrompt = isUz
          ? `👋 <b>Assalomu alaykum, ${escapeHtml(user.fullName)}!</b>\n\n` +
            `📞 <b>2-Qadam (3 tadan): Telefon Raqamingiz</b>\n` +
            `Pastdagi <b>[ 📱 Telefon raqamni yuborish ]</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring (masalan: <code>+998901234567</code>):`
          : `👋 <b>Welcome, ${escapeHtml(user.fullName)}!</b>\n\n` +
            `📞 <b>Step 2 of 3: Phone Number</b>\n` +
            `Tap the <b>[ 📱 Share Phone Number ]</b> button below or type your phone number (e.g. <code>+998901234567</code>):`;

        const msg = await ctx.reply(phonePrompt, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // 3. If phone is entered and waiting for degree level
      if (user.fullName && user.phone && !user.preferredLevel) {
        db.setWaitingFor(userId, "registration_level");
        const levelPrompt = isUz
          ? `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
            `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
          : `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
            `Please choose the degree level you plan to study in Poland:`;

        const msg = await ctx.reply(levelPrompt, {
          parse_mode: "HTML",
          reply_markup: getOnboardingDegreeKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // 4. Initial start -> Select Language
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
      `👋 <b>${user.lang === "uz" ? "Xush kelibsiz" : "Welcome back"}, ${escapeHtml(firstName)}!</b>\n` +
      `💎 ${user.lang === "uz" ? "A'zolik darajasi" : "Membership"}: <b>${escapeHtml(user.premiumTier || "Free")}</b>`;

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

    await ctx.reply(welcomeMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang),
    });
  });

  // User Oferta & Terms of Service display
  const handleUserOferta = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const renderedOferta = db.getRenderedOferta();
    const isUz = user.lang === "uz";
    const isRegistered = user.isRegistered;

    const text = isRegistered
      ? `${renderedOferta}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ <b>${isUz ? "Siz ushbu Ommaviy Ofertani qabul qilgansiz." : "You have previously accepted this Oferta."}</b>`
      : `${renderedOferta}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👇 <b>${isUz ? "Davom etish uchun shartlarni qabul qiling" : "Please accept terms to continue"}:</b>`;

    const kb = isRegistered
      ? new InlineKeyboard().text(isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", "go_main_menu")
      : getOfertaKeyboard(user.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb,
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  };

  bot.command("oferta", handleUserOferta);
  bot.command("terms", handleUserOferta);
  bot.callbackQuery("menu_oferta", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleUserOferta(ctx);
  });

  bot.callbackQuery("accept_oferta", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const isUz = db.getUser(userId).lang === "uz";

    // Mark as accepted and registered!
    db.acceptOferta(userId);
    const user = db.getUser(userId);

    await ctx.answerCallbackQuery({
      text: isUz
        ? "✅ Siz Foydalanish shartlari va Ommaviy Ofertani muvaffaqiyatli qabul qildingiz!"
        : "✅ You have successfully accepted the Terms of Service and Oferta!",
      show_alert: true,
    });

    const firstName = user.fullName || user.firstName || "Student";
    const welcomeMsg =
      `🎉 <b>${isUz ? "TABRIKLAYMIZ!" : "CONGRATULATIONS!"}</b>\n\n` +
      `🇵🇱 <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>\n\n` +
      `${escapeHtml(t(user.lang, "welcome_desc"))}\n\n` +
      `👋 <b>${isUz ? "Xush kelibsiz" : "Welcome"}, ${escapeHtml(firstName)}!</b>\n` +
      `💎 ${isUz ? "A'zolik darajasi" : "Membership"}: <b>${escapeHtml(user.premiumTier || "Free")}</b>\n\n` +
      `🚀 ${isUz ? "Endi siz Polsha universitetlarini ko'rishingiz, arizangizni topshirishingiz va barcha imkoniyatlardan foydalanishingiz mumkin." : "You can now explore Polish universities, apply for programs, and access all bot features."}`;

    try {
      await ctx.editMessageText(welcomeMsg, {
        parse_mode: "HTML",
      });
    } catch {}

    await ctx.reply(`🏠 <b>${escapeHtml(isUz ? "Bosh Menyu Ochildi" : "Main Menu Unlocked")}</b>`, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang),
    });
  });
}
