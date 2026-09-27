import { Bot, Context } from "grammy";
import { db } from "../services/db";
import {
  getMainMenuKeyboard,
  getOnboardingDegreeKeyboard,
  getPhoneRequestKeyboard,
  getOfertaKeyboard,
} from "../keyboards/menuKeyboards";
import { DegreeLevel } from "../types";
import { escapeHtml } from "../utils/format";

export function setupTextInputHandler(bot: Bot) {
  // Helper to cleanup user message and previous bot prompt
  const cleanUpInput = async (ctx: Context, userId: number) => {
    try {
      await ctx.deleteMessage();
    } catch {}

    const user = db.getUser(userId);
    if (user.lastPromptMsgId && ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, user.lastPromptMsgId);
      } catch {}
    }
  };

  // Handle contact sharing via Telegram button
  bot.on("message:contact", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const contact = ctx.message?.contact;
    if (!userId || !contact) return;

    await cleanUpInput(ctx, userId);
    const user = db.getUser(userId);

    if (user.waitingFor === "registration_phone" || !user.phone) {
      const phoneNumber = contact.phone_number.startsWith("+")
        ? contact.phone_number
        : `+${contact.phone_number}`;

      // Check if phone number is already registered by another user
      if (db.isPhoneRegistered(phoneNumber, userId)) {
        const errorMsg =
          user.lang === "uz"
            ? `⚠️ <b>Ushbu telefon raqam allaqachon ro'yxatdan o'tgan!</b>\n\n` +
              `Bitta telefon raqam faqat bitta Telegram akkauntga biriktiriladi. Iltimos, o'zingizning shaxsiy telefon raqamingizni yuboring:`
            : `⚠️ <b>This phone number is already registered!</b>\n\n` +
              `Each phone number can only be linked to one Telegram account. Please share or type your own phone number:`;

        const msg = await ctx.reply(errorMsg, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      db.updateUser(userId, { phone: phoneNumber });
      db.setWaitingFor(userId, "registration_level");

      const levelPrompt =
        user.lang === "uz"
          ? `✅ <b>Telefon raqamingiz qabul qilindi:</b> <code>${escapeHtml(phoneNumber)}</code>\n\n` +
            `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
            `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
          : `✅ <b>Phone number received:</b> <code>${escapeHtml(phoneNumber)}</code>\n\n` +
            `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
            `Please choose the degree level you plan to study in Poland:`;

      const msg = await ctx.reply(levelPrompt, {
        parse_mode: "HTML",
        reply_markup: getOnboardingDegreeKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
    }
  });

  // Handle Onboarding Degree Level Callback
  bot.callbackQuery(/^onboarding_level_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_level_(.+)$/);
    if (!match) return;
    const level = match[1] as DegreeLevel;
    const userId = ctx.from?.id;
    if (!userId) return;

    db.updateUser(userId, { preferredLevel: level });
    db.setWaitingFor(userId, "waiting_oferta_acceptance");

    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const renderedOferta = db.getRenderedOferta();

    await ctx.answerCallbackQuery();

    const ofertaMessage = isUz
      ? `📋 <b>Sizning Ma'lumotlaringiz:</b>\n` +
        `• 👤 <b>Ism:</b> ${escapeHtml(user.fullName || "")}\n` +
        `• 📞 <b>Telefon:</b> ${escapeHtml(user.phone || "")}\n` +
        `• 🎓 <b>Ta'lim Bosqichi:</b> ${escapeHtml(level)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${renderedOferta}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👇 <b>Botdan to'liq foydalanishni boshlash uchun Ofertani qabul qiling va "✅ Roziman" tugmasini bosing:</b>`
      : `📋 <b>Your Profile Summary:</b>\n` +
        `• 👤 <b>Name:</b> ${escapeHtml(user.fullName || "")}\n` +
        `• 📞 <b>Phone:</b> ${escapeHtml(user.phone || "")}\n` +
        `• 🎓 <b>Target Degree:</b> ${escapeHtml(level)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${renderedOferta}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👇 <b>To unlock the bot and begin, please read the Terms above and tap "✅ I Agree":</b>`;

    try {
      await ctx.editMessageText(ofertaMessage, {
        parse_mode: "HTML",
        reply_markup: getOfertaKeyboard(user.lang),
      });
    } catch {
      await ctx.reply(ofertaMessage, {
        parse_mode: "HTML",
        reply_markup: getOfertaKeyboard(user.lang),
      });
    }
  });

  // Handle text messages
  bot.on("message:text", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const text = ctx.message?.text?.trim();
    if (!userId || !text) return;

    const user = db.getUser(userId);

    // 1. Onboarding: Full Name
    if (user.waitingFor === "registration_name") {
      await cleanUpInput(ctx, userId);

      if (text.length < 3 || text.split(" ").length < 2) {
        const errorText =
          user.lang === "uz"
            ? `⚠️ Iltimos, to'liq ism va familiyangizni kiriting (masalan: <code>Saidislom Karimov</code>):`
            : `⚠️ Please enter your full first name and last name (e.g. <code>John Doe</code>):`;
        const msg = await ctx.reply(errorText, { parse_mode: "HTML" });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      db.updateUser(userId, { fullName: text });
      db.setWaitingFor(userId, "registration_phone");

      const phonePrompt =
        user.lang === "uz"
          ? `👋 <b>Rahmat, ${escapeHtml(text)}!</b>\n\n` +
            `📞 <b>2-Qadam (3 tadan): Telefon Raqamingiz</b>\n` +
            `Pastdagi <b>[ 📱 Telefon raqamni yuborish ]</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring (masalan: <code>+998901234567</code>):`
          : `👋 <b>Thank you, ${escapeHtml(text)}!</b>\n\n` +
            `📞 <b>Step 2 of 3: Phone Number</b>\n` +
            `Tap the <b>[ 📱 Share Phone Number ]</b> button below or type your phone number (e.g. <code>+998901234567</code>):`;

      const msg = await ctx.reply(phonePrompt, {
        parse_mode: "HTML",
        reply_markup: getPhoneRequestKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    // 2. Onboarding: Phone number entered via text
    if (user.waitingFor === "registration_phone") {
      await cleanUpInput(ctx, userId);

      const cleanPhone = text.replace(/[^\d+]/g, "");
      if (cleanPhone.length < 9) {
        const errorText =
          user.lang === "uz"
            ? `⚠️ Telefon raqam noto'g'ri shaklda. Iltimos, to'liq xalqaro formatda yozing (masalan: <code>+998901234567</code>):`
            : `⚠️ Invalid phone number format. Please provide full format (e.g. <code>+998901234567</code>):`;
        const msg = await ctx.reply(errorText, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      if (db.isPhoneRegistered(cleanPhone, userId)) {
        const errorMsg =
          user.lang === "uz"
            ? `⚠️ <b>Ushbu telefon raqam allaqachon ro'yxatdan o'tgan!</b> Iltimos, o'z telefon raqamingizni yuboring:`
            : `⚠️ <b>This phone number is already registered!</b> Please enter your own phone number:`;
        const msg = await ctx.reply(errorMsg, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      db.updateUser(userId, { phone: cleanPhone });
      db.setWaitingFor(userId, "registration_level");

      const levelPrompt =
        user.lang === "uz"
          ? `✅ <b>Telefon raqamingiz saqlandi:</b> <code>${escapeHtml(cleanPhone)}</code>\n\n` +
            `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
            `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
          : `✅ <b>Phone number saved:</b> <code>${escapeHtml(cleanPhone)}</code>\n\n` +
            `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
            `Please choose the degree level you plan to study in Poland:`;

      const msg = await ctx.reply(levelPrompt, {
        parse_mode: "HTML",
        reply_markup: getOnboardingDegreeKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    // Default response for registered users: send the Portal button
    if (user.isRegistered || user.acceptedOfertaAt) {
      const isUz = user.lang === "uz";
      const replyText = isUz
        ? `🏛️ <b>Poland Top Universities Portali</b>\n\n` +
          `Barcha universitetlar, ta'lim yo'nalishlari, hujjatlar monitoringi va boshqaruv shaxsiy portalda jamlangan.\n\n` +
          `👇 <b>Kirish uchun pastdagi tugmani bosing:</b>`
        : `🏛️ <b>Poland Top Universities Portal</b>\n\n` +
          `All universities, programs, documents and admissions are available in your portal.\n\n` +
          `👇 <b>Tap below to enter:</b>`;

      await ctx.reply(replyText, {
        parse_mode: "HTML",
        reply_markup: getMainMenuKeyboard(user.lang, userId),
      });
    }
  });
}
