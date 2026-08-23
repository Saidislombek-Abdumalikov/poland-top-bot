import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import {
  getUniversitiesListKeyboard,
  getUniversitiesFilterKeyboard,
  getUniversityDetailKeyboard,
} from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";

export function setupUniversityHandler(bot: Bot) {
  // Trigger from command /universities or text button
  const handleUniversitiesMenu = async (ctx: Context, cityFilter?: string, page: number = 0) => {
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

    const filtered = db.getAllUniversities(cityFilter);

    const title = isUz
      ? `🎓 <b>Polshaning Yetakchi Universitetlari</b>\n\n` +
        `Fakultetlar, reyting va qabul talablari bilan tanishish uchun universitetni tanlang:\n\n` +
        `📌 <i>${filtered.length} ta universitet ko'rsatilmoqda${cityFilter && cityFilter !== "all" ? ` (${escapeHtml(cityFilter)} shahrida)` : ""}</i>`
      : `🎓 <b>Top Polish Universities</b>\n\n` +
        `Select an institution below to view degree programs, rankings, and admission requirements:\n\n` +
        `📌 <i>Showing ${filtered.length} universities${cityFilter && cityFilter !== "all" ? ` in ${escapeHtml(cityFilter)}` : ""}</i>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(title, {
          parse_mode: "HTML",
          reply_markup: getUniversitiesListKeyboard(user.lang, filtered, page),
        });
        return;
      } catch {}
    }

    await ctx.reply(title, {
      parse_mode: "HTML",
      reply_markup: getUniversitiesListKeyboard(user.lang, filtered, page),
    });
  };

  bot.command("universities", async (ctx) => handleUniversitiesMenu(ctx));
  bot.callbackQuery("menu_unis", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleUniversitiesMenu(ctx);
  });
  bot.hears([/.*Universities.*/i, /.*Universitetlar.*/i], async (ctx) => handleUniversitiesMenu(ctx));

  // Pagination callback
  bot.callbackQuery(/^uni_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^uni_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const allUnis = db.getAllUniversities();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      isUz
        ? `🎓 <b>Polshaning Yetakchi Universitetlari</b>\n\n📌 <i>${page + 1}-sahifa</i>`
        : `🎓 <b>Top Polish Universities</b>\n\n📌 <i>Page ${page + 1}</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getUniversitiesListKeyboard(user.lang, allUnis, page),
      }
    );
  });

  // Open city filter (edit in place)
  bot.callbackQuery("uni_open_city_filter", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);

    await ctx.answerCallbackQuery();
    try {
      await ctx.editMessageText(`🏙️ <b>${escapeHtml(t(user.lang, "uni_filter_city"))}:</b>`, {
        parse_mode: "HTML",
        reply_markup: getUniversitiesFilterKeyboard(user.lang),
      });
    } catch {
      await ctx.reply(`🏙️ <b>${escapeHtml(t(user.lang, "uni_filter_city"))}:</b>`, {
        parse_mode: "HTML",
        reply_markup: getUniversitiesFilterKeyboard(user.lang),
      });
    }
  });

  // Apply city filter callback (edit in place)
  bot.callbackQuery(/^uni_city_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^uni_city_(.+)$/);
    if (!match) return;
    const city = match[1];

    await ctx.answerCallbackQuery();
    await handleUniversitiesMenu(ctx, city, 0);
  });

  // View university details (edit in place)
  bot.callbackQuery(/^view_uni_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^view_uni_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const uni = db.getUniversity(uniId);
    if (!uni) {
      await ctx.answerCallbackQuery({ text: isUz ? "Universitet topilmadi" : "University not found" });
      return;
    }

    const desc = uni.description ? (uni.description[user.lang] || uni.description.en) : "";
    const facultiesList = (uni.faculties || []).map((f) => `  • ${escapeHtml(f)}`).join("\n");
    const reqsList = (uni.requirements || []).map((r) => `  • ${escapeHtml(r)}`).join("\n");

    const text = isUz
      ? `🏛️ <b>${escapeHtml(uni.name)} (${escapeHtml(uni.abbr)})</b>\n` +
        `📍 <b>${escapeHtml(uni.city)}, Polsha</b> | 🏫 <b>${uni.type === "Public" ? "Davlat" : "Xususiy"} Universiteti</b>\n\n` +
        (desc ? `📝 ${escapeHtml(desc)}\n\n` : "") +
        `📊 <b>Asosiy Ko'rsatkichlar va Reyting:</b>\n` +
        `• 🏆 Milliy Reyting: <b>${escapeHtml(uni.ranking || "N/A")}</b>\n` +
        `• 🎓 Dasturlar: <b>${uni.programsCount || 0} ta</b> | 👥 Jami Talabalar: <b>${(uni.students || 0).toLocaleString()} ta</b>\n` +
        `• 🌍 Xalqaro Talabalar: <b>${(uni.internationalStudents || 0).toLocaleString()} ta</b>\n` +
        `• 📅 Hujjat Qabul Muddati: <b>${escapeHtml(uni.deadline || "August 15")}</b>\n\n` +
        `💰 <b>O'rtacha Kontrakt Narxi:</b>\n` +
        `• Ingliz tilidagi dasturlar: <b>${escapeHtml(uni.tuition?.english || "2,500 EUR/yr")}</b>\n` +
        `• Polyak tilidagi dasturlar: <b>${escapeHtml(uni.tuition?.nonEu || "2,000 EUR/yr")}</b>\n` +
        `• Yevropa Ittifoqi fuqarolari: <b>${escapeHtml(uni.tuition?.eu || "Free / 0 EUR")}</b>\n\n` +
        (facultiesList ? `🏛️ <b>Asosiy Fakultetlar:</b>\n${facultiesList}\n\n` : "") +
        (reqsList ? `📋 <b>Umumiy Qabul Talablari:</b>\n${reqsList}` : "")
      : `🏛️ <b>${escapeHtml(uni.name)} (${escapeHtml(uni.abbr)})</b>\n` +
        `📍 <b>${escapeHtml(uni.city)}, Poland</b> | 🏫 <b>${escapeHtml(uni.type)} University</b>\n\n` +
        (desc ? `📝 ${escapeHtml(desc)}\n\n` : "") +
        `📊 <b>Key Facts & Rankings:</b>\n` +
        `• 🏆 Ranking: <b>${escapeHtml(uni.ranking || "N/A")}</b>\n` +
        `• 🎓 Programs: <b>${uni.programsCount || 0}</b> | 👥 Students: <b>${(uni.students || 0).toLocaleString()}</b>\n` +
        `• 🌍 International students: <b>${(uni.internationalStudents || 0).toLocaleString()}</b>\n` +
        `• 📅 Application deadline: <b>${escapeHtml(uni.deadline || "August 15")}</b>\n\n` +
        `💰 <b>Estimated Tuition:</b>\n` +
        `• English-taught: <b>${escapeHtml(uni.tuition?.english || "2,500 EUR/yr")}</b>\n` +
        `• Non-EU (Polish-taught): <b>${escapeHtml(uni.tuition?.nonEu || "2,000 EUR/yr")}</b>\n` +
        `• EU Citizens: <b>${escapeHtml(uni.tuition?.eu || "Free / 0 EUR")}</b>\n\n` +
        (facultiesList ? `🏛️ <b>Key Faculties:</b>\n${facultiesList}\n\n` : "") +
        (reqsList ? `📋 <b>General Admission Requirements:</b>\n${reqsList}` : "");

    await ctx.answerCallbackQuery();

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getUniversityDetailKeyboard(user.lang, uni),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getUniversityDetailKeyboard(user.lang, uni),
    });
  });

  // Back to universities list (edit in place)
  bot.callbackQuery("back_to_unis", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleUniversitiesMenu(ctx);
  });
}
