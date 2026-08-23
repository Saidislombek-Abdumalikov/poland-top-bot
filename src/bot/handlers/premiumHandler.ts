import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import { getPremiumKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";

export function setupPremiumHandler(bot: Bot) {
  const handlePremiumMenu = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const statusBadge = user.isPremium
      ? (isUz
          ? `💎 <b>A'zolik Holati:</b> <b>${escapeHtml(user.premiumTier || "Full Premium")} (FAOLLASHTIRILGAN ✅)</b>` +
            (user.premiumCode ? `\n🔑 <b>Faol Kod:</b> <code>${escapeHtml(user.premiumCode)}</code>` : "")
          : `💎 <b>Membership Tier:</b> <b>${escapeHtml(user.premiumTier || "Full Premium")} (ACTIVE ✅)</b>` +
            (user.premiumCode ? `\n🔑 <b>Active Code:</b> <code>${escapeHtml(user.premiumCode)}</code>` : ""))
      : (isUz
          ? `⚪ <b>A'zolik Holati:</b> Oddiy Talaba (Free)`
          : `⚪ <b>Membership Tier:</b> Free Student`);

    const text = isUz
      ? `💎 <b>VIP Qabul & Premium A'zolik</b>\n\n` +
        `${statusBadge}\n\n` +
        `🌟 <b>Premium Imtiyozlari:</b>\n` +
        `${t(user.lang, "premium_benefits")}\n\n` +
        (user.isPremium
          ? `✨ <i>Sizda qabul komissiyasi va hujjatlarni tezkor tasdiqlash uchun barcha VIP imkoniyatlar faol!</i>`
          : `💡 <i>Agar sizda faollashtirish promokodi bo'lsa, uni kiritish uchun pastdagi "Promokodni Faollashtirish" tugmasini bosing:</i>`)
      : `💎 <b>VIP Admissions & Premium Access</b>\n\n` +
        `${statusBadge}\n\n` +
        `🌟 <b>Premium Benefits:</b>\n` +
        `${t(user.lang, "premium_benefits")}\n\n` +
        (user.isPremium
          ? `✨ <i>You have full priority access to our admissions team & fast-track document processing!</i>`
          : `💡 <i>If you received an activation code from your consultant, tap "Activate Access Code" below to unlock full access:</i>`);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getPremiumKeyboard(user.lang, user.isPremium),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getPremiumKeyboard(user.lang, user.isPremium),
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
        `Sizga berilgan promokodni pastda yozib yuboring (masalan: <code>PTU-DGRZ-JWHB</code>):`
      : `🔑 <b>Enter Your Activation Code:</b>\n\n` +
        `Type or paste your random activation code below (e.g. <code>PTU-DGRZ-JWHB</code>):`;

    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}
