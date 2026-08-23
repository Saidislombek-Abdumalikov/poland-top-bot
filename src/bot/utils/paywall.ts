import { Context, InlineKeyboard } from "grammy";
import { UserSessionData } from "../types";
import { escapeHtml } from "./format";

export async function checkPremiumAccess(
  ctx: Context,
  user: UserSessionData,
  featureName: { en: string; uz: string } | string
): Promise<boolean> {
  if (user.isPremium) {
    return true;
  }

  const isUz = user.lang === "uz";
  const name =
    typeof featureName === "object"
      ? (isUz ? featureName.uz : featureName.en)
      : featureName;

  const text = isUz
    ? `🔒 <b>VIP Premium Xizmat Talab Qilinadi</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>${escapeHtml(name)}</b> xizmatidan foydalanish faqat <b>PTU Premium A'zolari</b> uchun mavjud.\n\n` +
      `🌟 <b>Premium A'zolik Imtiyozlari:</b>\n` +
      `• 🏛️ Universitetga to'g'ridan-to'g'ri ariza topshirish va qabulni nazorat qilish\n` +
      `• 📁 Rasmiy maslahatchilar tomonidan hujjatlarni to'liq tekshirish va tasdiqlash\n` +
      `• 🏛️ Rasmiy NAWA SYRENA nostrifikatsiyasi va Polsha qasamyodli tarjimasi (Tłumacz Przysięgły)\n` +
      `• ✍️ Barcha kirish imtihonlari va fan testlariga to'liq kirish\n` +
      `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 doimiy aloqa\n\n` +
      `💡 <i>Agar sizda faollashtirish kodi bo'lsa, pastdagi "Promokodni Faollashtirish" tugmasini bosing:</i>`
    : `🔒 <b>VIP Premium Feature Required</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Access to <b>${escapeHtml(name)}</b> is available exclusively for <b>PTU Premium Members</b>.\n\n` +
      `🌟 <b>What You Get with Premium Access:</b>\n` +
      `• 🏛️ Direct University Application Filing & Dossier Submission\n` +
      `• 📁 Certified Document Verification by Licensed Admissions Advisors\n` +
      `• 🏛️ Official NAWA Legalization & Sworn Translation (Tłumacz Przysięgły)\n` +
      `• ✍️ Full University Entrance & Placement Exam Preparations\n` +
      `• 💬 1-on-1 Personal Admissions Consultant Support\n\n` +
      `💡 <i>If you have purchased an activation code, tap "Activate Code" below:</i>`;

  const kb = new InlineKeyboard()
    .text(isUz ? "🔑 Promokodni Faollashtirish" : "🔑 Activate Access Code", "premium_enter_code")
    .row()
    .url(isUz ? "💬 Maslahatchidan Kod Olish" : "💬 Get Access Code from Advisor", "https://t.me/poland_admissions_bot")
    .row()
    .text(isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", "go_main_menu");

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({
      text: isUz ? "🔒 VIP Premium Xizmat Talab Qilinadi" : "🔒 VIP Premium Feature Required",
    });
  }

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: kb,
  });

  return false;
}
