import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import { getReviewsKeyboard, getReviewRatingKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";

export function setupReviewHandler(bot: Bot) {
  const handleReviewsMenu = async (ctx: Context, page: number = 0) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const approvedReviews = db.getApprovedReviews();
    const pageSize = 2;
    const start = page * pageSize;
    const pageItems = approvedReviews.slice(start, start + pageSize);

    let reviewsText = "";
    if (pageItems.length === 0) {
      reviewsText = isUz
        ? `<i>Hozircha sharhlar mavjud emas. Birinchi bo'lib o'z sharhingizni qoldiring!</i>`
        : `<i>No reviews yet. Be the first to share your experience studying in Poland!</i>`;
    } else {
      pageItems.forEach((rev) => {
        const text = rev.text[user.lang] || rev.text.en;
        reviewsText +=
          `⭐ <b>${"⭐".repeat(rev.rating)}</b> | <b>${escapeHtml(rev.name)}</b> (${escapeHtml(rev.country)})\n` +
          `🏛️ <i>${escapeHtml(rev.university)}</i> — <code>${escapeHtml(rev.program)}</code> (${rev.year})\n` +
          `💬 "${escapeHtml(text)}"\n\n`;
      });
    }

    const title = isUz
      ? `⭐ <b>Polshada O'qiyotgan Talabalar Fikrlari</b>\n\n` +
        `O'zbekistonlik va xalqaro talabalarning Polsha universitetlari, viza va yotoqxona bo'yicha real tajribalari:\n\n` +
        `${reviewsText}` +
        `📌 <i>${page + 1}-sahifa (jami ${approvedReviews.length} ta sharh)</i>`
      : `⭐ <b>Student Experiences & Reviews</b>\n\n` +
        `Real feedback and advice from international students currently studying at top Polish universities:\n\n` +
        `${reviewsText}` +
        `📌 <i>Page ${page + 1} (${approvedReviews.length} reviews total)</i>`;

    const kb = getReviewsKeyboard(user.lang, approvedReviews, page, pageSize);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(title, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(title, { parse_mode: "HTML", reply_markup: kb });
  };

  bot.command("reviews", async (ctx) => handleReviewsMenu(ctx));
  bot.callbackQuery("menu_reviews", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleReviewsMenu(ctx);
  });

  // Reviews Pagination
  bot.callbackQuery(/^revs_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^revs_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    await ctx.answerCallbackQuery();
    await handleReviewsMenu(ctx, page);
  });

  // Start review submission
  bot.callbackQuery("review_write_start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    await ctx.answerCallbackQuery();

    const text = isUz
      ? `✍️ <b>O'z Sharhingizni Qoldiring (1-Qadam: Baho)</b>\n\n` +
        `Polshadagi ta'lim yoki PTU boti xizmatlariga qanday baho berasiz?`
      : `✍️ <b>Write a Review (Step 1: Rating)</b>\n\n` +
        `How would you rate your experience studying in Poland or using PTU admissions?`;

    const kb = getReviewRatingKeyboard(user.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  // Rating selected -> prompt university & program
  bot.callbackQuery(/^rev_rate_(\d)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^rev_rate_(\d)$/);
    if (!match) return;
    const rating = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    db.setWaitingFor(userId, "student_review_program", { rating });

    await ctx.answerCallbackQuery();

    const text = isUz
      ? `🏛️ <b>2-Qadam: Universitet va Mutaxassislik</b>\n\n` +
        `Qaysi universitet va fakultetda o'qiyapsiz (yoki topshirgansiz)?\n` +
        `<i>Masalan:</i> <code>University of Warsaw - Computer Science</code>`
      : `🏛️ <b>Step 2: University & Degree Program</b>\n\n` +
        `Which university and program are you studying at (or applied to)?\n` +
        `<i>Example:</i> <code>University of Warsaw - Computer Science</code>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
        return;
      } catch {}
    }

    const msg = await ctx.reply(text, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}
