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
    const pricing = db.getPricingConfig();

    const displayTier =
      user.premiumTier === "NAWA_FULL" || user.premiumTier === "Full Premium"
        ? "Full Application + NAWA"
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
        `📦 <b>1. NAWA — $${pricing.nawaPrice}</b>\n` +
        `• 🏛️ Standart NAWA SYRENA arizasi va yo'riqnomasi\n` +
        `• 📋 Nostrifikatsiya talablari bo'yicha to'liq qo'llanma\n` +
        `• 🔍 Universitetlar va dasturlar ma'lumotlar bazasiga kirish\n\n` +
        `📦 <b>2. Full Application + NAWA — $${pricing.fullApplicationNawaPrice}</b>\n` +
        `• ✨ NAWA paketidagi barcha xizmatlar\n` +
        `• 📁 Kerakli hujjatlarni to'plash, to'liq tekshirish va tasdiqlash\n` +
        `• 🏛️ Universitet arizalarini to'liq yuritish va qabul nazorati\n` +
        `• 📜 Qasamyodli tarjima (Tłumacz Przysięgły) va legalizatsiya ko'magi\n` +
        `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 doimiy aloqa\n\n` +
        `💶 <b>Rasmiy Universitet To'lovi:</b>\n` +
        `• <b>€${pricing.applicationFee} Application Fee</b> (Universitet/konsullik rasmiy arizasi uchun — alohida to'lanadi)\n\n` +
        (user.isPremium
          ? (user.premiumTier === "NAWA"
              ? `💡 <i>Sizda hozir <b>NAWA ($${pricing.nawaPrice})</b> rejasi faol. <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice})</b> ga oshirish uchun yangi promokod kiriting yoki maslahatchi bilan bog'laning:</i>`
              : `✨ <i>Sizda barcha VIP imkoniyatlar va qabul koordinatsiyasi to'liq faol!</i>`)
          : `💡 <i>Agar sizda faollashtirish promokodi bo'lsa, quyidagi <b>"🎟️ Promokod bormi?"</b> tugmasini bosing:</i>`)
      : `💎 <b>POLAND TOP UNIVERSITIES — PREMIUM PLANS</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${statusBadge}\n\n` +
        `Choose from two tailored premium packages for admission and official legalization:\n\n` +
        `📦 <b>1. NAWA — $${pricing.nawaPrice}</b>\n` +
        `• 🏛️ Standard NAWA SYRENA application guidance\n` +
        `• 📋 Diploma recognition and nostrification instructions\n` +
        `• 🔍 Full access to university and program directories\n\n` +
        `📦 <b>2. Full Application + NAWA — $${pricing.fullApplicationNawaPrice}</b>\n` +
        `• ✨ Everything in the NAWA plan\n` +
        `• 📁 Comprehensive document collection, review & verification\n` +
        `• 🏛️ End-to-end university application filing & status tracking\n` +
        `• 📜 Sworn translation (Tłumacz Przysięgły) & legalization guidance\n` +
        `• 💬 1-on-1 Dedicated Admissions Consultant Support\n\n` +
        `💶 <b>Official Administrative Fee:</b>\n` +
        `• <b>€${pricing.applicationFee} Application Fee</b> (Official university/consular dossier fee — paid separately)\n\n` +
        (user.isPremium
          ? (user.premiumTier === "NAWA"
              ? `💡 <i>You are currently on <b>NAWA ($${pricing.nawaPrice})</b>. To upgrade to <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice})</b>, enter an upgrade promo code or contact your advisor:</i>`
              : `✨ <i>You have full access to all priority admissions tools and document reviews!</i>`)
          : `💡 <i>If you have an activation promo code, tap <b>"🎟️ Have a promo code?"</b> below:</i>`);

    const kb = getPremiumKeyboard(user.lang, user.isPremium, user.premiumTier, pricing.fullApplicationNawaPrice);

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

  const handlePromoCommand = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const pricing = db.getPricingConfig();

    const rawMatch = ctx.match ? ctx.match.toString().trim() : "";
    const codeMatch = rawMatch.match(/[A-Za-z0-9]{6,12}/);

    if (codeMatch) {
      const codeToRedeem = codeMatch[0].toUpperCase();
      const res = db.redeemPromoCode(codeToRedeem, userId);
      if (res.success && res.tier) {
        const isNawaFull = res.tier === "NAWA_FULL" || res.tier === "Full Premium";
        const tierName = isNawaFull
          ? `Full Application + NAWA ($${pricing.fullApplicationNawaPrice})`
          : `NAWA ($${pricing.nawaPrice})`;

        const successMsg = isUz
          ? `🎉 <b>TABRIKLAYMIZ!</b>\n\n` +
            `Siz kiritgan <code>${escapeHtml(codeToRedeem)}</code> promokodi muvaffaqiyatli faollashtirildi!\n` +
            `🌟 <b>Ochilgan A'zolik Paketi:</b> <b>${escapeHtml(tierName)}</b>\n\n` +
            (isNawaFull
              ? `• 📁 Hujjatlar nazorati va qabul hujjatlarini to'liq tekshirish\n` +
                `• 🏛️ Universitetlarga to'g'ridan-to'g'ri ariza topshirish huquqi\n` +
                `• 📜 NAWA SYRENA arizasi va Polsha qasamyodli tarjimalari (Tłumacz Przysięgły)\n` +
                `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 aloqa`
              : `• 🏛️ Standart NAWA SYRENA arizasi va nostrifikatsiya yo'riqnomasi\n` +
                `• 📋 Polsha oliygohlari qabul talablari va dasturlar bazasi\n` +
                `• ✍️ Boshlang'ich testlar va tayyorgarlik materiallari`)
          : `🎉 <b>CONGRATULATIONS!</b>\n\n` +
            `Your promo code <code>${escapeHtml(codeToRedeem)}</code> has been redeemed successfully!\n` +
            `🌟 <b>Unlocked Package:</b> <b>${escapeHtml(tierName)}</b>\n\n` +
            (isNawaFull
              ? `• 📁 Full Document Checklist & Certified Advisor Verification\n` +
                `• 🏛️ Direct University Application Filing & Dossier Processing\n` +
                `• 📜 NAWA SYRENA Legalization & Sworn Translations (Tłumacz Przysięgły)\n` +
                `• 💬 1-on-1 Dedicated Admissions Consultant Support`
              : `• 🏛️ Standard NAWA SYRENA Application & Recognition Guide\n` +
                `• 📋 Polish University Admission Requirements Directory\n` +
                `• ✍️ Standard Exam Preparation Materials`);

        await ctx.reply(successMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: isNawaFull
              ? [
                  [{ text: isUz ? "📁 Hujjatlarni Yuklash" : "📁 Document Checklist", callback_data: "menu_docs" }],
                  [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
                ]
              : [[{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }]],
          },
        });
        return;
      } else {
        await ctx.reply(
          isUz
            ? `❌ <b>Promokod xato yoki faol emas:</b> ${escapeHtml(res.error || "Tekshirib qayta kiriting.")}`
            : `❌ <b>Invalid or expired code:</b> ${escapeHtml(res.error || "Please verify and try again.")}`,
          { parse_mode: "HTML" }
        );
        return;
      }
    }

    db.setWaitingFor(userId, "premium_code");
    const promptText = isUz
      ? `🔑 <b>Faollashtirish Promokodini Kiriting:</b>\n\n` +
        `Sizga berilgan 8 xonali promokodni pastda yozib yuboring (masalan: <code>K7X9P2LM</code>):`
      : `🔑 <b>Enter Your Activation Promo Code:</b>\n\n` +
        `Type or paste your 8-character promo code below (e.g. <code>K7X9P2LM</code>):`;

    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  };

  bot.command("premium", async (ctx) => {
    const rawMatch = ctx.match ? ctx.match.toString().trim() : "";
    if (rawMatch) {
      await handlePromoCommand(ctx);
    } else {
      await handlePremiumMenu(ctx);
    }
  });
  bot.command(["promo", "promocode"], async (ctx) => handlePromoCommand(ctx));
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
