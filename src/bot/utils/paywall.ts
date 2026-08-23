import { Context, InlineKeyboard } from "grammy";
import { UserSessionData } from "../types";
import { db } from "../services/db";
import { escapeHtml } from "./format";

/**
 * Checks if user is entitled to NAWA standard documentation features.
 */
export function isNawaAllowed(user: UserSessionData): boolean {
  if (!user.isPremium) return false;
  return (
    user.premiumTier === "NAWA" ||
    user.premiumTier === "NAWA_FULL" ||
    user.premiumTier === "Full Premium" ||
    user.premiumTier === "VIP Admissions"
  );
}

/**
 * Checks if user is entitled to Full Application + NAWA comprehensive features.
 */
export function isNawaFullAllowed(user: UserSessionData): boolean {
  if (!user.isPremium) return false;
  return (
    user.premiumTier === "NAWA_FULL" ||
    user.premiumTier === "Full Premium" ||
    user.premiumTier === "VIP Admissions"
  );
}

/**
 * Enforces server-side paywall authorization for premium features.
 */
export async function checkPremiumAccess(
  ctx: Context,
  user: UserSessionData,
  featureName: { en: string; uz: string } | string,
  requiredProduct: "NAWA" | "NAWA_FULL" = "NAWA"
): Promise<boolean> {
  // Check entitlement
  if (requiredProduct === "NAWA" && isNawaAllowed(user)) {
    return true;
  }
  if (requiredProduct === "NAWA_FULL" && isNawaFullAllowed(user)) {
    return true;
  }

  const pricing = db.getPricingConfig();
  const isUz = user.lang === "uz";
  const name =
    typeof featureName === "object"
      ? (isUz ? featureName.uz : featureName.en)
      : featureName;

  // Case 1: User has NAWA ($15) but needs Full Application + NAWA ($50)
  if (user.isPremium && user.premiumTier === "NAWA" && requiredProduct === "NAWA_FULL") {
    const text = isUz
      ? `💎 <b>Full Application + NAWA Rejasi Talab Qilinadi</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Sizning hozirgi tarifingiz: <b>NAWA ($${pricing.nawaPrice})</b>\n` +
        `<b>${escapeHtml(name)}</b> xizmatidan foydalanish uchun <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice})</b> paketi talab etiladi.\n\n` +
        `🌟 <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice}) Imkoniyatlari:</b>\n` +
        `• 📁 Barcha kerakli hujjatlarni to'plash, tekshirish va tasdiqlash\n` +
        `• 🏛️ Universitet arizalarini to'liq yuritish va qabul nazorati\n` +
        `• 📜 Qasamyodli tarjima (Tłumacz Przysięgły) va legalizatsiya ko'magi\n` +
        `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 doimiy aloqa\n\n` +
        `💶 <i>Eslatma: Universitet arizalari uchun €${pricing.applicationFee} Application Fee rasmiy to'lovi alohida to'lanadi.</i>\n\n` +
        `💡 <i>Agar sizda Full Application + NAWA promokodi bo'lsa, uni quyida kiriting yoki maslahatchi bilan bog'laning:</i>`
      : `💎 <b>Full Application + NAWA Plan Required</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Your Current Plan: <b>NAWA ($${pricing.nawaPrice})</b>\n` +
        `Access to <b>${escapeHtml(name)}</b> requires the <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice})</b> package.\n\n` +
        `🌟 <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice}) Includes:</b>\n` +
        `• 📁 Document collection, review, and verification workflow\n` +
        `• 🏛️ Full university application submission & dossier tracking\n` +
        `• 📜 Sworn translations (Tłumacz Przysięgły) & legalization guidance\n` +
        `• 💬 1-on-1 Dedicated Admissions Consultant Support\n\n` +
        `💶 <i>Note: The €${pricing.applicationFee} university application fee applies separately where required.</i>\n\n` +
        `💡 <i>If you have an upgrade promo code, tap below to activate:</i>`;

    const kb = new InlineKeyboard()
      .text(isUz ? "🔑 Promokodni Faollashtirish" : "🔑 Activate Promo Code", "premium_enter_code")
      .row()
      .url(isUz ? "💬 Maslahatchi bilan Bog'lanish" : "💬 Contact Consultant", "https://t.me/poland_admissions_bot")
      .row()
      .text(isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", "go_main_menu");

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: isUz ? "💎 Full Application + NAWA Talab Qilinadi" : "💎 Full Application + NAWA Required",
      });
    }

    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
    return false;
  }

  // Case 2: Free user (not premium)
  const text = isUz
    ? `💎 <b>Premium Tariflar va Xizmatlar</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>${escapeHtml(name)}</b> xizmatidan foydalanish uchun quyidagi premium paketlardan birini tanlang:\n\n` +
      `📦 <b>1. NAWA — $${pricing.nawaPrice}</b>\n` +
      `• Standart NAWA SYRENA arizasi va yo'riqnomasi\n` +
      `• Nostrifikatsiya talablari bo'yicha yo'l-yo'riq\n` +
      `• Standart ma'lumotlar bazasiga kirish\n\n` +
      `📦 <b>2. Full Application + NAWA — $${pricing.fullApplicationNawaPrice}</b>\n` +
      `• NAWA paketidagi barcha xizmatlar\n` +
      `• Kerakli hujjatlarni to'plash, to'liq tekshirish va tasdiqlash\n` +
      `• Universitet arizalarini to'liq topshirish va qabul nazorati\n` +
      `• Qasamyodli tarjima va legalizatsiya ko'magi\n` +
      `• Shaxsiy qabul koordinatori bilan doimiy aloqa\n\n` +
      `💶 <b>Rasmiy To'lov:</b>\n` +
      `• <b>€${pricing.applicationFee} Application Fee</b> (Universitet/konsullik rasmiy arizasi uchun — alohida to'lanadi)\n\n` +
      `💡 <i>Agar sizda faollashtirish promokodi bo'lsa, uni quyidagi tugma orqali kiriting:</i>`
    : `💎 <b>Premium Plans & Services</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Access to <b>${escapeHtml(name)}</b> requires a premium plan. Choose the package that suits your goals:\n\n` +
      `📦 <b>1. NAWA — $${pricing.nawaPrice}</b>\n` +
      `• Standard NAWA SYRENA application & recognition guide\n` +
      `• Diploma nostrification requirement guidance\n` +
      `• Standard admissions resources access\n\n` +
      `📦 <b>2. Full Application + NAWA — $${pricing.fullApplicationNawaPrice}</b>\n` +
      `• Everything in the NAWA plan\n` +
      `• Complete document collection, review, and verification\n` +
      `• End-to-end university application filing & dossier management\n` +
      `• Sworn translation and legalization assistance\n` +
      `• 1-on-1 Dedicated Admissions Consultant\n\n` +
      `💶 <b>Official Fee:</b>\n` +
      `• <b>€${pricing.applicationFee} Application Fee</b> (Official university/consular administrative fee — paid separately)\n\n` +
      `💡 <i>If you have an activation promo code, tap below to enter it:</i>`;

  const kb = new InlineKeyboard()
    .text(isUz ? "🎟️ Promokod bormi?" : "🎟️ Have a promo code?", "premium_enter_code")
    .row()
    .url(isUz ? "💬 Maslahatchi bilan Bog'lanish" : "💬 Contact Consultant", "https://t.me/poland_admissions_bot")
    .row()
    .text(isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", "go_main_menu");

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({
      text: isUz ? "🔒 Premium Xizmat Talab Qilinadi" : "🔒 Premium Service Required",
    });
  }

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: kb,
  });

  return false;
}
