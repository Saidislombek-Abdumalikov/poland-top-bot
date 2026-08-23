import { Context, InlineKeyboard } from "grammy";
import { UserSessionData } from "../types";
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
 * Checks if user is entitled to NAWA Full comprehensive features.
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

  const isUz = user.lang === "uz";
  const name =
    typeof featureName === "object"
      ? (isUz ? featureName.uz : featureName.en)
      : featureName;

  // Case 1: User has NAWA ($15) but needs NAWA Full ($50)
  if (user.isPremium && user.premiumTier === "NAWA" && requiredProduct === "NAWA_FULL") {
    const text = isUz
      ? `💎 <b>NAWA Full Rejasi Talab Qilinadi</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Sizning hozirgi tarifingiz: <b>NAWA ($15)</b>\n` +
        `<b>${escapeHtml(name)}</b> xizmatidan foydalanish uchun <b>NAWA Full ($50)</b> paketi talab etiladi.\n\n` +
        `🌟 <b>NAWA Full ($50) Imkoniyatlari:</b>\n` +
        `• 📁 Barcha kerakli hujjatlarni to'plash, tekshirish va tasdiqlash\n` +
        `• 🏛️ Universitet arizalarini to'liq yuritish va qabul nazorati\n` +
        `• 📜 Qasamyodli tarjima (Tłumacz Przysięgły) va legalizatsiya ko'magi\n` +
        `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 doimiy aloqa\n\n` +
        `💶 <i>Eslatma: Universitet arizalari uchun €30 Application Fee rasmiy to'lovi alohida to'lanadi.</i>\n\n` +
        `💡 <i>Agar sizda NAWA Full promokodi bo'lsa, uni quyida kiriting yoki maslahatchi bilan bog'laning:</i>`
      : `💎 <b>NAWA Full Plan Required</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Your Current Plan: <b>NAWA ($15)</b>\n` +
        `Access to <b>${escapeHtml(name)}</b> requires the <b>NAWA Full ($50)</b> package.\n\n` +
        `🌟 <b>NAWA Full ($50) Includes:</b>\n` +
        `• 📁 Document collection, review, and verification workflow\n` +
        `• 🏛️ Full university application submission & dossier tracking\n` +
        `• 📜 Sworn translations (Tłumacz Przysięgły) & legalization guidance\n` +
        `• 💬 1-on-1 Dedicated Admissions Consultant Support\n\n` +
        `💶 <i>Note: The €30 university application fee applies separately where required.</i>\n\n` +
        `💡 <i>If you have an upgrade promo code, tap below to activate:</i>`;

    const kb = new InlineKeyboard()
      .text(isUz ? "🔑 Promokodni Faollashtirish" : "🔑 Activate Promo Code", "premium_enter_code")
      .row()
      .url(isUz ? "💬 Maslahatchi bilan Bog'lanish" : "💬 Contact Consultant", "https://t.me/poland_admissions_bot")
      .row()
      .text(isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", "go_main_menu");

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: isUz ? "💎 NAWA Full Talab Qilinadi" : "💎 NAWA Full Required",
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
      `📦 <b>1. NAWA — $15</b>\n` +
      `• Standart NAWA SYRENA arizasi va yo'riqnomasi\n` +
      `• Nostrifikatsiya talablari bo'yicha yo'l-yo'riq\n` +
      `• Standart ma'lumotlar bazasiga kirish\n\n` +
      `📦 <b>2. NAWA Full — $50</b>\n` +
      `• NAWA paketidagi barcha xizmatlar\n` +
      `• Kerakli hujjatlarni to'plash, to'liq tekshirish va tasdiqlash\n` +
      `• Universitet arizalarini to'liq topshirish va qabul nazorati\n` +
      `• Qasamyodli tarjima va legalizatsiya ko'magi\n` +
      `• Shaxsiy qabul koordinatori bilan doimiy aloqa\n\n` +
      `💶 <b>Rasmiy To'lov:</b>\n` +
      `• <b>€30 Application Fee</b> (Universitet/konsullik rasmiy arizasi uchun — alohida to'lanadi)\n\n` +
      `💡 <i>Agar sizda faollashtirish promokodi bo'lsa, uni quyidagi tugma orqali kiriting:</i>`
    : `💎 <b>Premium Plans & Services</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Access to <b>${escapeHtml(name)}</b> requires a premium plan. Choose the package that suits your goals:\n\n` +
      `📦 <b>1. NAWA — $15</b>\n` +
      `• Standard NAWA SYRENA application & recognition guide\n` +
      `• Diploma nostrification requirement guidance\n` +
      `• Standard admissions resources access\n\n` +
      `📦 <b>2. NAWA Full — $50</b>\n` +
      `• Everything in the NAWA plan\n` +
      `• Complete document collection, review, and verification\n` +
      `• End-to-end university application filing & dossier management\n` +
      `• Sworn translation and legalization assistance\n` +
      `• 1-on-1 Dedicated Admissions Consultant\n\n` +
      `💶 <b>Official Fee:</b>\n` +
      `• <b>€30 Application Fee</b> (Official university/consular administrative fee — paid separately)\n\n` +
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
