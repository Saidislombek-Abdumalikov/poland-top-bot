import { Bot, Context, InlineKeyboard } from "grammy";
import { db } from "../services/db";
import { config } from "../config";
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
import { authenticatePasscode, isAuthorizedAdmin, startAdminSession } from "../services/auth";

export function setupStartHandler(bot: Bot) {
  // /start and /portal command
  bot.command(["start", "portal"], async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

    // If user is not yet registered, guide them to their current onboarding step
    if (!user.isRegistered && !user.isAdmin && !user.acceptedOfertaAt) {
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

    // Already registered student -> Welcome back with portal entry button
    const firstName = user.fullName || user.firstName || "Student";
    const isUz = user.lang === "uz";

    // Reset menu button to default so mini app is NOT exposed as a persistent menu button
    try {
      await ctx.setChatMenuButton({
        menu_button: { type: "default" },
      });
    } catch {}

    const welcomeMsg =
      `🇵🇱 <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>\n\n` +
      `👋 <b>${isUz ? "Xush kelibsiz" : "Welcome back"}, ${escapeHtml(firstName)}!</b>\n\n` +
      `🏛️ ${isUz ? "Barcha Polsha oliygohlari, dasturlar, hujjatlar monitoringi va imtihon materiallari Sizning shaxsiy portalingizda jamlangan." : "Explore Polish universities, degree programs, track documents, and practice entrance exams in your personal portal."}\n\n` +
      `👇 <b>${isUz ? "Shaxsiy kabinetingizga kirish uchun pastdagi tugmani bosing:" : "Tap below to enter your student portal:"}</b>`;

    const msg = await ctx.reply(welcomeMsg, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang, userId),
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

  // Dedicated /admin command (e.g. /admin ADMINPTU)
  bot.command("admin", async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });
    const isUz = user.lang === "uz";
    const inputPasscode = (ctx.match || "").toString().trim();
    const baseUrl = config.webappUrl || "https://poland-top-bot.onrender.com";
    const adminUrl = `${baseUrl}?userId=${userId}&admin=true`;

    // 1. Passcode provided: e.g. /admin ADMINPTU
    if (inputPasscode) {
      if (authenticatePasscode(inputPasscode)) {
        startAdminSession(userId);

        const adminKb = new InlineKeyboard().webApp(
          isUz ? "🛡️ Admin Portalga Kirish" : "🛡️ Open Admin Portal",
          adminUrl
        );

        const msg = isUz
          ? `🛡️ <b>Administrator Tasdiqlandi!</b>\n\n` +
            `Assalomu alaykum! Siz muvaffaqiyatli administrator sifatida tizimga kirdingiz.\n\n` +
            `Talabalar bazasi, arizalar, hujjatlar tekshiruvi, yangi oliygohlar va barchaga e'lon yuborish uchun pastdagi tugmani bosing:\n\n` +
            `👇 <b>Admin Portal Havolasi:</b>`
          : `🛡️ <b>Administrator Verified!</b>\n\n` +
            `Welcome! You have successfully logged in as administrator.\n\n` +
            `Tap below to open your management dashboard:\n\n` +
            `👇 <b>Admin Portal Link:</b>`;

        await ctx.reply(msg, {
          parse_mode: "HTML",
          reply_markup: adminKb,
        });
        return;
      } else {
        const errorMsg = isUz
          ? `❌ <b>Parol noto'g'ri!</b>\n\n` +
            `Admin portaliga kirish uchun to'g'ri parolni kiriting:\n` +
            `👉 <code>/admin ADMINPTU</code>`
          : `❌ <b>Invalid passcode!</b>\n\n` +
            `To access the admin portal, enter the valid passcode:\n` +
            `👉 <code>/admin ADMINPTU</code>`;

        await ctx.reply(errorMsg, { parse_mode: "HTML" });
        return;
      }
    }

    // 2. No passcode, but user already has active admin session
    if (isAuthorizedAdmin(userId)) {
      const adminKb = new InlineKeyboard().webApp(
        isUz ? "🛡️ Admin Portalga Kirish" : "🛡️ Open Admin Portal",
        adminUrl
      );

      const msg = isUz
        ? `🛡️ <b>Administrator Portali</b>\n\n` +
          `Siz tizimda avtorizatsiyadan o'tgansiz. Boshqaruv markazini ochish uchun pastdagi havolani bosing:\n\n` +
          `👇 <b>Admin Portal Havolasi:</b>`
        : `🛡️ <b>Administrator Portal</b>\n\n` +
          `You are authorized. Tap below to launch your management dashboard:\n\n` +
          `👇 <b>Admin Portal Link:</b>`;

      await ctx.reply(msg, {
        parse_mode: "HTML",
        reply_markup: adminKb,
      });
      return;
    }

    // 3. Not authorized and no passcode provided
    const promptMsg = isUz
      ? `🔒 <b>Administrator Boshqaruv Markazi</b>\n\n` +
        `Admin portaliga kirish havolasini olish uchun quyidagi buyruqni yuboring:\n` +
        `👉 <code>/admin ADMINPTU</code>`
      : `🔒 <b>Administrator Control Center</b>\n\n` +
        `To receive your admin portal link, please send:\n` +
        `👉 <code>/admin ADMINPTU</code>`;

    await ctx.reply(promptMsg, { parse_mode: "HTML" });
  });

  // Redirect all legacy commands to the Mini App portal
  bot.command(
    ["universities", "programs", "documents", "tests", "exams", "profile", "help"],
    async (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;
      try {
        await ctx.deleteMessage();
      } catch {}

      const user = db.getUser(userId);
      const isUz = user.lang === "uz";

      if (!user.isRegistered && !user.acceptedOfertaAt) {
        const msg = await ctx.reply(
          isUz
            ? "⚠️ <b>Iltimos, avval ro'yxatdan o'ting:</b>\nBoshlash uchun tilni tanlang:"
            : "⚠️ <b>Please complete registration first:</b>\nChoose language to begin:",
          {
            parse_mode: "HTML",
            reply_markup: getOnboardingLanguageKeyboard(),
          }
        );
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      await ctx.reply(
        isUz
          ? `🏛️ <b>Poland Top Universities Portali</b>\n\n` +
            `Barcha oliygohlar, dasturlar, hujjatlar monitoringi va boshqaruv shaxsiy portalga ko'chirilgan.\n\n` +
            `👇 <b>Kirish uchun pastdagi havola tugmasini bosing:</b>`
          : `🏛️ <b>Poland Top Universities Portal</b>\n\n` +
            `All admissions, programs, document tracking and admin features are inside your portal.\n\n` +
            `👇 <b>Tap below to open portal:</b>`,
        {
          parse_mode: "HTML",
          reply_markup: getMainMenuKeyboard(user.lang, userId),
        }
      );
    }
  );

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
      `👋 <b>${user.lang === "uz" ? "Xush kelibsiz" : "Welcome back"}, ${escapeHtml(firstName)}!</b>`;

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

    // Reset menu button to default so mini app is NOT exposed as a persistent menu button
    try {
      await ctx.setChatMenuButton({
        menu_button: { type: "default" },
      });
    } catch {}

    const firstName = user.fullName || user.firstName || "Student";
    const welcomeMsg =
      `🎉 <b>${isUz ? "TABRIKLAYMIZ!" : "CONGRATULATIONS!"}</b>\n\n` +
      `👋 <b>${isUz ? "Xush kelibsiz" : "Welcome"}, ${escapeHtml(firstName)}!</b>\n\n` +
      `🇵🇱 <b>${escapeHtml(t(user.lang, "welcome_title"))}</b>\n\n` +
      `🚀 ${isUz ? "Sizning shaxsiy talaba portalingiz muvaffaqiyatli faollashtirildi! Endi barcha nufuzli Polsha oliygohlari, ta'lim yo'nalishlari, hujjatlar tekshiruvi va qabul arizalari bitta qulay mobil portalda." : "Your student portal is now active! Explore Polish universities, programs, track documents and manage applications in your personal mobile portal."}\n\n` +
      `👇 <b>${isUz ? "Portaldan foydalanish uchun pastdagi tugmani bosing:" : "Tap below to launch your portal:"}</b>`;

    try {
      await ctx.editMessageText(welcomeMsg, {
        parse_mode: "HTML",
      });
    } catch {}

    await ctx.reply(isUz ? "🚀 <b>Sizning Shaxsiy Portalingiz:</b>" : "🚀 <b>Your Student Portal:</b>", {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang, userId),
    });
  });
}
