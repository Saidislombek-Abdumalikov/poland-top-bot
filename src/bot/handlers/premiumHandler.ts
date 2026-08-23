import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { getPremiumKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";

export function setupPremiumHandler(bot: Bot) {
  const handlePremiumMenu = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const displayTier =
      user.premiumTier === "NAWA_FULL" || user.premiumTier === "Full Premium"
        ? "NAWA Full"
        : user.premiumTier === "NAWA"
        ? "NAWA"
        : user.premiumTier || "Free";

    const statusBadge = user.isPremium
      ? (isUz
          ? `💎 <b>A'zolik Holati:</b> <b>${escapeHtml(displayTier)} (FAOLLASHTIRILGAN ✅)</b>` +
            (user.premiumCode ? `\n🔑 <b>Faol Kod:</b> <code>${escapeHtml(user.premiumCode)}</code>` : "")
          : `💎 <b>Membership Tier:</b> <b>${escapeHtml(displayTier)} (ACTIVE ✅)</b>` +
            (user.premiumCode ? `\n🔑 <b>Active Code:</b> <code>${escapeHtml(user.premiumCode)}</code>` : ""))
      : (isUz
          ? `⚪ <b>A'zolik Holati:</b> Oddiy Talaba (Free)`
          : `⚪ <b>Membership Tier:</b> Free Student`);

    const text = isUz
      ? `💎 <b>POLAND TOP UNIVERSITIES — PREMIUM TARIFLARI</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${statusBadge}\n\n` +
        `Polsha oliygohlariga qabul va rasmiy hujjatlashtirish uchun 2 xil premium paket mavjud:\n\n` +
        `📦 <b>1. NAWA — $15</b>\n` +
        `• 🏛️ Standart NAWA SYRENA arizasi va yo'riqnomasi\n` +
        `• 📋 Nostrifikatsiya talablari bo'yicha to'liq qo'llanma\n` +
        `• 🔍 Universitetlar va dasturlar ma'lumotlar bazasiga kirish\n\n` +
        `📦 <b>2. NAWA Full — $50</b>\n` +
        `• ✨ NAWA paketidagi barcha xizmatlar\n` +
        `• 📁 Kerakli hujjatlarni to'plash, to'liq tekshirish va tasdiqlash\n` +
        `• 🏛️ Universitet arizalarini to'liq yuritish va qabul nazorati\n` +
        `• 📜 Qasamyodli tarjima (Tłumacz Przysięgły) va legalizatsiya ko'magi\n` +
        `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 doimiy aloqa\n\n` +
        `💶 <b>Rasmiy Universitet To'lovi:</b>\n` +
        `• <b>€30 Application Fee</b> (Universitet/konsullik rasmiy arizasi uchun — alohida to'lanadi)\n\n` +
        (user.isPremium
          ? (user.premiumTier === "NAWA"
              ? `💡 <i>Sizda hozir <b>NAWA ($15)</b> rejasi faol. <b>NAWA Full ($50)</b> ga oshirish uchun yangi promokod kiriting yoki maslahatchi bilan bog'laning:</i>`
              : `✨ <i>Sizda barcha VIP imkoniyatlar va qabul koordinatsiyasi to'liq faol!</i>`)
          : `💡 <i>Agar sizda faollashtirish promokodi bo'lsa, quyidagi <b>"🎟️ Promokod bormi?"</b> tugmasini bosing:</i>`)
      : `💎 <b>POLAND TOP UNIVERSITIES — PREMIUM PLANS</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${statusBadge}\n\n` +
        `Choose from two tailored premium packages for admission and official legalization:\n\n` +
        `📦 <b>1. NAWA — $15</b>\n` +
        `• 🏛️ Standard NAWA SYRENA application guidance\n` +
        `• 📋 Diploma recognition and nostrification instructions\n` +
        `• 🔍 Full access to university and program directories\n\n` +
        `📦 <b>2. NAWA Full — $50</b>\n` +
        `• ✨ Everything in the NAWA plan\n` +
        `• 📁 Comprehensive document collection, review & verification\n` +
        `• 🏛️ End-to-end university application filing & status tracking\n` +
        `• 📜 Sworn translation (Tłumacz Przysięgły) & legalization guidance\n` +
        `• 💬 1-on-1 Dedicated Admissions Consultant Support\n\n` +
        `💶 <b>Official Administrative Fee:</b>\n` +
        `• <b>€30 Application Fee</b> (Official university/consular dossier fee — paid separately)\n\n` +
        (user.isPremium
          ? (user.premiumTier === "NAWA"
              ? `💡 <i>You are currently on <b>NAWA ($15)</b>. To upgrade to <b>NAWA Full ($50)</b>, enter an upgrade promo code or contact your advisor:</i>`
              : `✨ <i>You have full access to all priority admissions tools and document reviews!</i>`)
          : `💡 <i>If you have an activation promo code, tap <b>"🎟️ Have a promo code?"</b> below:</i>`);

    const kb = getPremiumKeyboard(user.lang, user.isPremium, user.premiumTier);

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

  bot.command("premium", async (ctx) => handlePremiumMenu(ctx));
  bot.callbackQuery("menu_premium", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handlePremiumMenu(ctx);
  });
  bot.hears([/.*Premium Access.*/i, /.*Premium A'zolik.*/i, /.*Premium.*/i], async (ctx) => handlePremiumMenu(ctx));

  // Prompt code input
  bot.callbackQuery("premium_enter_code", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    db.setWaitingFor(userId, "premium_code");

    await ctx.answerCallbackQuery();

    const promptText = isUz
      ? `🔑 <b>Faollashtirish Promokodini Kiriting:</b>\n\n` +
        `Sizga berilgan 8 xonali promokodni pastda yozib yuboring (masalan: <code>K7X9P2LM</code>):`
      : `🔑 <b>Enter Your Activation Promo Code:</b>\n\n` +
        `Type or paste your 8-character promo code below (e.g. <code>K7X9P2LM</code>):`;

    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}
