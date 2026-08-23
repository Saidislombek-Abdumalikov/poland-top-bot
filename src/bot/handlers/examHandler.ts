import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import { getTestsListKeyboard, getTestDetailKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";
import { checkPremiumAccess } from "../utils/paywall";

export function setupExamHandler(bot: Bot) {
  const handleTestsMenu = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    if (!user.isRegistered && !user.isAdmin) {
      await ctx.reply(
        isUz
          ? "⚠️ <b>Iltimos, avval ro'yxatdan o'ting.</b> Boshlash uchun /start buyrug'ini yuboring."
          : "⚠️ <b>Please complete registration first.</b> Send /start to begin.",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        }
      );
      return;
    }

    const tests = db.getAllTests();
    const text = isUz
      ? `📝 <b>Polsha Universitetlari Kirish Testlari & Qo'llanmalar (PDF)</b>\n\n` +
        `Polsha davlat va yetakchi xususiy universitetlariga kirish imtihonlari, til darajalari va namunaviy test to'plamlari:\n\n` +
        `💡 <i>Ko'rish yoki yuklab olish uchun kerakli test materialini tanlang:</i>`
      : `📝 <b>Entrance Exams & Sample Test Papers (PDF)</b>\n\n` +
        `Official entrance examination problem sets, sample solutions, and language certification tests for Polish universities:\n\n` +
        `💡 <i>Select a test material below to view details or download files:</i>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getTestsListKeyboard(user.lang, tests),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getTestsListKeyboard(user.lang, tests),
    });
  };

  bot.command(["exams", "tests", "testlar"], async (ctx) => handleTestsMenu(ctx));
  bot.callbackQuery(["menu_exams", "menu_tests", "go_exams_menu"], async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleTestsMenu(ctx);
  });
  bot.hears([/.*Practice Exams.*/i, /.*Mashq Imtihonlari.*/i, /.*Testlar.*/i, /.*Tests.*/i], async (ctx) =>
    handleTestsMenu(ctx)
  );

  // View specific test material
  bot.callbackQuery(/^view_test_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^view_test_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const test = db.getTest(testId);
    if (!test) {
      await ctx.answerCallbackQuery({ text: isUz ? "Test topilmadi" : "Test not found" });
      return;
    }

    // VIP Gating check if not free
    if (!test.isFree) {
      const hasAccess = await checkPremiumAccess(
        ctx,
        user,
        isUz ? "Kirish Imtihonlari va Test Materiallari (PDF)" : "Entrance Exams & Test Materials (PDF)",
        "NAWA_FULL"
      );
      if (!hasAccess) return;
    }

    await ctx.answerCallbackQuery();

    const title = test.title[user.lang] || test.title.en;
    const desc = test.description
      ? test.description[user.lang] || test.description.en
      : isUz
      ? "Rasmiy namunaviy test to'plami."
      : "Official entrance test material.";

    const text = isUz
      ? `📝 <b>${escapeHtml(title)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📚 <b>Fan / Yo'nalish:</b> ${escapeHtml(test.subject)}\n` +
        `💎 <b>Holati:</b> ${test.isFree ? "🟢 Bepul Namunaviy Variant" : "🔒 VIP Imtihon To'plami"}\n` +
        (test.fileName ? `📁 <b>Fayl:</b> <code>${escapeHtml(test.fileName)}</code>\n` : "") +
        `📅 <b>Sana:</b> ${test.createdAt}\n\n` +
        `📖 <b>Tavsif:</b>\n${escapeHtml(desc)}\n\n` +
        `📥 <i>Faylni yuklab olish yoki ko'rish uchun quyidagi tugmadan foydalaning:</i>`
      : `📝 <b>${escapeHtml(title)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📚 <b>Subject / Field:</b> ${escapeHtml(test.subject)}\n` +
        `💎 <b>Access Tier:</b> ${test.isFree ? "🟢 Free Sample" : "🔒 VIP Entrance Pack"}\n` +
        (test.fileName ? `📁 <b>File:</b> <code>${escapeHtml(test.fileName)}</code>\n` : "") +
        `📅 <b>Date:</b> ${test.createdAt}\n\n` +
        `📖 <b>Description:</b>\n${escapeHtml(desc)}\n\n` +
        `📥 <i>Use the buttons below to download or view the test file:</i>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getTestDetailKeyboard(user.lang, test),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getTestDetailKeyboard(user.lang, test),
    });
  });

  // Direct Telegram File Download
  bot.callbackQuery(/^download_test_file_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^download_test_file_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const test = db.getTest(testId);
    if (!test || !test.fileId) {
      await ctx.answerCallbackQuery({
        text: isUz ? "Fayl mavjud emas" : "File not available",
      });
      return;
    }

    if (!test.isFree) {
      const hasAccess = await checkPremiumAccess(
        ctx,
        user,
        isUz ? "Kirish Imtihonlari va Test Materiallari (PDF)" : "Entrance Exams & Test Materials (PDF)",
        "NAWA_FULL"
      );
      if (!hasAccess) return;
    }

    await ctx.answerCallbackQuery({ text: isUz ? "Fayl yuborilmoqda..." : "Sending file..." });

    try {
      await ctx.replyWithDocument(test.fileId, {
        caption: isUz
          ? `📄 <b>${escapeHtml(test.title[user.lang] || test.title.en)}</b>\n\n🇵🇱 @poland_top_universitiesbot`
          : `📄 <b>${escapeHtml(test.title[user.lang] || test.title.en)}</b>\n\n🇵🇱 @poland_top_universitiesbot`,
        parse_mode: "HTML",
      });
    } catch (e) {
      await ctx.reply(
        isUz
          ? "❌ Faylni yuborishda xatolik yuz berdi. Iltimos, havoladan foydalaning."
          : "❌ Failed to send document. Please use the download link."
      );
    }
  });
}
