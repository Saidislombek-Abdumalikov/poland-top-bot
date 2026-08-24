import { Bot, Context, InlineKeyboard } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import { programs } from "../data/programs";
import {
  getProgramsListKeyboard,
  getProgramsFilterKeyboard,
  getProgramDetailKeyboard,
} from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";
import { checkPremiumAccess } from "../utils/paywall";

export function setupProgramHandler(bot: Bot) {
  // Session filters memory per user
  const userFilters: Map<number, { level?: string; city?: string; field?: string; uniId?: string }> = new Map();

  const handleProgramsMenu = async (ctx: Context, page: number = 0) => {
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

    const filter = userFilters.get(userId) || {};

    let filtered = programs;
    if (filter.level) {
      filtered = filtered.filter((p) => p.level.toLowerCase() === filter.level?.toLowerCase());
    }
    if (filter.city) {
      filtered = filtered.filter((p) => p.city.toLowerCase() === filter.city?.toLowerCase());
    }
    if (filter.field) {
      filtered = filtered.filter((p) => p.field.toLowerCase().includes(filter.field?.toLowerCase() || ""));
    }
    if (filter.uniId) {
      filtered = filtered.filter((p) => p.uniId === filter.uniId);
    }

    const pageSize = 5;
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    const pageItems = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

    let filterSummary = "";
    if (Object.keys(filter).length > 0) {
      filterSummary = isUz
        ? `\n🔍 <i>Faol filtrlar: ${Object.values(filter).filter(Boolean).join(", ")}</i>`
        : `\n🔍 <i>Active filters: ${Object.values(filter).filter(Boolean).join(", ")}</i>`;
    }

    const title = isUz
      ? `📚 <b>Polshadagi Ta'lim Dasturlari (${filtered.length} ta mavjud)</b>${filterSummary}\n\nQuyidagi yo'nalishlardan birini tanlang yoki filtrlardan foydalaning:`
      : `📚 <b>Degree Programs in Poland (${filtered.length} available)</b>${filterSummary}\n\nSelect a program below to view admissions criteria, tuition, and apply:`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(title, {
          parse_mode: "HTML",
          reply_markup: getProgramsListKeyboard(user.lang, pageItems, safePage, totalPages),
        });
        return;
      } catch {}
    }

    await ctx.reply(title, {
      parse_mode: "HTML",
      reply_markup: getProgramsListKeyboard(user.lang, pageItems, safePage, totalPages),
    });
  };

  bot.command("programs", async (ctx) => handleProgramsMenu(ctx));
  bot.callbackQuery("menu_progs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProgramsMenu(ctx);
  });
  bot.hears([/.*Degree Programs.*/i, /.*Ta'lim Dasturlari.*/i, /.*Programs.*/i], async (ctx) => handleProgramsMenu(ctx));

  // Pagination for programs
  bot.callbackQuery(/^progs_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^progs_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    await ctx.answerCallbackQuery();
    await handleProgramsMenu(ctx, page);
  });

  // Filter menu (edit in place)
  bot.callbackQuery("progs_filter_menu", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const filter = userFilters.get(userId) || {};
    const isUz = user.lang === "uz";

    const text = isUz
      ? `🔍 <b>Ta'lim Dasturlarini Saralash (Filtr):</b>\n\n` +
        `• Bosqich: <b>${filter.level || "Barchasi"}</b>\n` +
        `• Shahar: <b>${filter.city || "Barchasi"}</b>\n` +
        `• Yo'nalish: <b>${filter.field || "Barchasi"}</b>\n\n` +
        `Quyidagi mezonlardan birini tanlang:`
      : `🔍 <b>Filter Degree Programs:</b>\n\n` +
        `• Level: <b>${filter.level || "All"}</b>\n` +
        `• City: <b>${filter.city || "All"}</b>\n` +
        `• Field: <b>${filter.field || "All"}</b>\n\n` +
        `Choose a criteria below:`;

    await ctx.answerCallbackQuery();
    try {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: getProgramsFilterKeyboard(user.lang, filter),
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: getProgramsFilterKeyboard(user.lang, filter),
      });
    }
  });

  // Filter by Level
  bot.callbackQuery(/^filter_level_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^filter_level_(.+)$/);
    if (!match) return;
    const level = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;

    const current = userFilters.get(userId) || {};
    userFilters.set(userId, { ...current, level: level === "all" ? undefined : level });

    await ctx.answerCallbackQuery({ text: `Filter: ${level}` });
    await handleProgramsMenu(ctx);
  });

  // Filter by City
  bot.callbackQuery(/^filter_city_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^filter_city_(.+)$/);
    if (!match) return;
    const city = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;

    const current = userFilters.get(userId) || {};
    userFilters.set(userId, { ...current, city: city === "all" ? undefined : city });

    await ctx.answerCallbackQuery({ text: `City: ${city}` });
    await handleProgramsMenu(ctx);
  });

  // Filter by Field
  bot.callbackQuery(/^filter_field_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^filter_field_(.+)$/);
    if (!match) return;
    const field = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;

    const current = userFilters.get(userId) || {};
    userFilters.set(userId, { ...current, field: field === "all" ? undefined : field });

    await ctx.answerCallbackQuery({ text: `Field: ${field}` });
    await handleProgramsMenu(ctx);
  });

  // Clear filters
  bot.callbackQuery("filter_clear", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      userFilters.delete(userId);
    }
    await ctx.answerCallbackQuery({ text: "Filters cleared" });
    await handleProgramsMenu(ctx);
  });

  // View Program details (edit in place)
  bot.callbackQuery(/^view_prog_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^view_prog_(.+)$/);
    if (!match) return;
    const progId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const prog = programs.find((p) => p.id === progId);
    if (!prog) {
      await ctx.answerCallbackQuery({ text: isUz ? "Dastur topilmadi" : "Program not found" });
      return;
    }

    const isSaved = (user.savedPrograms || []).includes(prog.id);
    const desc = prog.about[user.lang] || prog.about.en;
    const reqsList = prog.requirements.map((r) => `  • ${escapeHtml(r)}`).join("\n");
    const docsList = prog.documents.map((d) => `  • ${escapeHtml(d)}`).join("\n");

    const text = isUz
      ? `📘 <b>${escapeHtml(prog.name)}</b>\n` +
        `🏛️ <b>${escapeHtml(prog.university)}</b> (${escapeHtml(prog.city)})\n\n` +
        `📝 ${escapeHtml(desc)}\n\n` +
        `📊 <b>Dastur Tafsilotlari:</b>\n` +
        `• 🎓 Ta'lim Darajasi: <b>${escapeHtml(prog.level)}</b>\n` +
        `• 🗣️ O'qitish Tili: <b>${escapeHtml(prog.lang)}</b>\n` +
        `• ⏱️ Davomiyligi: <b>${escapeHtml(prog.duration)}</b>\n` +
        `• 💰 Kontrakt To'lovi: <b>${escapeHtml(prog.tuition)}</b>\n` +
        `• 📅 Qabul Muddati: <b>${escapeHtml(prog.deadline)}</b>\n` +
        `• 🟢 Qabul Holati: <b>${escapeHtml(prog.status)}</b>\n\n` +
        `📋 <b>Qabul Talablari:</b>\n${reqsList}\n\n` +
        `📑 <b>Zarur Hujjatlar:</b>\n${docsList}`
      : `📘 <b>${escapeHtml(prog.name)}</b>\n` +
        `🏛️ <b>${escapeHtml(prog.university)}</b> (${escapeHtml(prog.city)})\n\n` +
        `📝 ${escapeHtml(desc)}\n\n` +
        `📊 <b>Program Details:</b>\n` +
        `• 🎓 Degree Level: <b>${escapeHtml(prog.level)}</b>\n` +
        `• 🗣️ Language of Instruction: <b>${escapeHtml(prog.lang)}</b>\n` +
        `• ⏱️ Duration: <b>${escapeHtml(prog.duration)}</b>\n` +
        `• 💰 Tuition: <b>${escapeHtml(prog.tuition)}</b>\n` +
        `• 📅 Application Deadline: <b>${escapeHtml(prog.deadline)}</b>\n` +
        `• 🟢 Status: <b>${escapeHtml(prog.status)}</b>\n\n` +
        `📋 <b>Admission Requirements:</b>\n${reqsList}\n\n` +
        `📑 <b>Required Documents:</b>\n${docsList}`;

    await ctx.answerCallbackQuery();

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getProgramDetailKeyboard(user.lang, prog.id, isSaved),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getProgramDetailKeyboard(user.lang, prog.id, isSaved),
    });
  });

  // Save / Unsave bookmark
  bot.callbackQuery(/^toggle_save_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^toggle_save_(.+)$/);
    if (!match) return;
    const progId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);

    const isSaved = db.toggleSaveProgram(userId, progId);
    await ctx.answerCallbackQuery({
      text: isSaved ? t(user.lang, "prog_saved_success") : t(user.lang, "prog_unsaved_success"),
    });

    try {
      await ctx.editMessageReplyMarkup({
        reply_markup: getProgramDetailKeyboard(user.lang, progId, isSaved),
      });
    } catch {}
  });

  // Apply to program (Premium Gated)
  bot.callbackQuery(/^apply_prog_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^apply_prog_(.+)$/);
    if (!match) return;
    const progId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const hasAccess = await checkPremiumAccess(
      ctx,
      user,
      {
        en: "Direct University Application Submission",
        uz: "Universitetga To'g'ridan-to'g'ri Ariza Topshirish",
      },
      "NAWA_FULL"
    );
    if (!hasAccess) return;

    const prog = programs.find((p) => p.id === progId);
    if (!prog) return;

    const app = db.createApplication(userId, prog.id, prog.name, prog.university, prog.city);

    await ctx.answerCallbackQuery();

    const text = isUz
      ? `🎉 <b>${escapeHtml(prog.name)} Dasturiga Ariza Muvaffaqiyatli Topshirildi!</b>\n\n` +
        `🏛️ <b>Universitet:</b> ${escapeHtml(prog.university)} (${escapeHtml(prog.city)})\n` +
        `📌 <b>Ariza ID:</b> <code>#${escapeHtml(app.id)}</code>\n` +
        `📅 <b>Qabul Muddati:</b> ${escapeHtml(prog.deadline)}\n` +
        `📌 <b>Holati:</b> Topshirildi (Maslahatchi tekshiruvida)\n\n` +
        `👉 Keyingi qadam: <b>Hujjatlar Nazorati</b> bo'limiga kiring va barcha zarur hujjatlaringizni yuklang.`
      : `🎉 <b>Application Submitted for ${escapeHtml(prog.name)}!</b>\n\n` +
        `🏛️ <b>University:</b> ${escapeHtml(prog.university)} (${escapeHtml(prog.city)})\n` +
        `📌 <b>Application ID:</b> <code>#${escapeHtml(app.id)}</code>\n` +
        `📅 <b>Deadline:</b> ${escapeHtml(prog.deadline)}\n` +
        `📌 <b>Status:</b> Submitted (Awaiting Advisor Verification)\n\n` +
        `👉 Next Step: Upload your documents in the <b>Document Checklist</b> menu so advisors can verify your dossier.`;

    const kb = new InlineKeyboard()
      .text(isUz ? "📁 Hujjatlarni Yuklash & Nazorat" : "📁 Document Checklist", "menu_docs")
      .row()
      .text(isUz ? "👤 Mening Profilim & Arizalarim" : "👤 My Profile & Applications", "menu_profile")
      .row()
      .text(isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", "go_main_menu");

    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery("back_to_progs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProgramsMenu(ctx);
  });
}
