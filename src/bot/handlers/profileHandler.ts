import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import { programs } from "../data/programs";
import { getLanguageInlineKeyboard, getOnboardingLanguageKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";

export function setupProfileHandler(bot: Bot) {
  const handleProfileMenu = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = db.getUser(userId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

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

    const userApps = db.getUserApplications(userId);
    let appsSummary = isUz
      ? "<i>Aktiv arizalar mavjud emas. Ariza topshirish uchun ta'lim dasturlaridan birini tanlang!</i>"
      : "<i>No active applications yet. Select a degree in the Programs menu to apply!</i>";

    if (userApps.length > 0) {
      appsSummary = "";
      userApps.forEach((app) => {
        const stageIcon =
          app.stage === "Accepted"
            ? "✅"
            : app.stage === "University Review"
            ? "🏛️"
            : app.stage === "Processing"
            ? "🟡"
            : app.stage === "Action Needed"
            ? "🔴"
            : "⚪";

        const stageName = isUz
          ? app.stage === "Submitted"
            ? "Topshirildi"
            : app.stage === "Processing"
            ? "Jarayonda"
            : app.stage === "University Review"
            ? "Universitet Tekshiruvida"
            : app.stage === "Action Needed"
            ? "Tuzatish Talab Etiladi"
            : app.stage === "Accepted"
            ? "Qabul Qilindi 🎉"
            : app.stage
          : app.stage;

        appsSummary +=
          `📘 <b>${escapeHtml(app.programName)}</b>\n` +
          `🏛️ ${escapeHtml(app.university)} (${escapeHtml(app.city)})\n` +
          `📌 ${isUz ? "Holati" : "Stage"}: ${stageIcon} <b>${escapeHtml(stageName)}</b>\n` +
          (app.counselorNote
            ? `💬 ${isUz ? "Maslahatchi Izohi" : "Counselor Note"}: <i>"${escapeHtml(app.counselorNote)}"</i>\n`
            : "") +
          `📅 ${isUz ? "Topshirilgan sana" : "Applied on"}: ${escapeHtml(app.submittedAt)}\n\n`;
      });
    }

    const docs = user.documents || {};
    const totalDocs = Object.keys(docs).length || 7;
    const verifiedDocs = Object.values(docs).filter((d) => d.status === "approved").length;
    const filled = Math.max(0, Math.min(10, Math.round((verifiedDocs / totalDocs) * 10)));
    const progressBar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);

    const savedCount = (user.savedPrograms || []).length;
    const fullName = user.fullName || user.firstName || "Student";
    const usernameDisplay = user.username ? `@${escapeHtml(user.username)}` : "<i>(mavjud emas)</i>";
    const notSetText = isUz ? "<i>(kiritilmagan)</i>" : "<i>(not set)</i>";
    const phoneDisplay = user.phone ? escapeHtml(user.phone) : notSetText;
    const tierDisplay = escapeHtml(user.premiumTier || "Free");
    const codeDisplay = user.premiumCode ? ` (Kod: <code>${escapeHtml(user.premiumCode)}</code>)` : "";

    const text = isUz
      ? `👤 <b>${escapeHtml(fullName)} — Talaba Profili</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🆔 Foydalanuvchi ID: <code>${user.userId}</code>\n` +
        `• 💬 Username: ${usernameDisplay}\n` +
        `• 📞 Telefon: ${phoneDisplay}\n` +
        `• 🎓 Maqsad Qilingan Bosqich: <b>${escapeHtml(user.preferredLevel || "Bakalavr")}</b>\n` +
        `• 🇺🇿 Fuqarolik: ${escapeHtml(user.country || "O'zbekiston")}\n` +
        `• 🌐 Tanlangan Til: O'zbekcha 🇺🇿\n` +
        `• 💎 A'zolik Darajasi: <b>${tierDisplay}</b>${codeDisplay}\n` +
        `• ⭐ Saqlangan Dasturlar: <b>${savedCount} ta</b>\n\n` +
        `📁 <b>Hujjatlar Tayyorgarligi:</b>\n` +
        `${progressBar} <b>${verifiedDocs}/${totalDocs} Tasdiqlangan</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📑 <b>Universitetga Arizalar:</b>\n` +
        `${appsSummary}`
      : `👤 <b>${escapeHtml(fullName)} — Student Profile</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🆔 User ID: <code>${user.userId}</code>\n` +
        `• 💬 Username: ${usernameDisplay}\n` +
        `• 📞 Phone: ${phoneDisplay}\n` +
        `• 🎓 Target Degree: <b>${escapeHtml(user.preferredLevel || "Bachelor")}</b>\n` +
        `• 🇺🇿 Citizenship: ${escapeHtml(user.country || "Uzbekistan")}\n` +
        `• 🌐 Language: English 🇬🇧\n` +
        `• 💎 Membership: <b>${tierDisplay}</b>${codeDisplay}\n` +
        `• ⭐ Saved Degrees: <b>${savedCount}</b>\n\n` +
        `📁 <b>Document Verification Progress:</b>\n` +
        `${progressBar} <b>${verifiedDocs}/${totalDocs} Verified</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📑 <b>Application Status:</b>\n` +
        `${appsSummary}`;

    const kb = {
      inline_keyboard: isUz
        ? [
            [{ text: `⭐ Saqlangan Dasturlar (${savedCount})`, callback_data: "view_saved_programs" }],
            [{ text: "📝 Ma'lumotlarni Qayta Kiritish", callback_data: "start_registration_wizard" }],
            [{ text: "🌐 Tilni O'zgartirish (UZ / EN)", callback_data: "profile_switch_lang" }],
            [{ text: "🏠 Bosh Menyu", callback_data: "go_main_menu" }],
          ]
        : [
            [{ text: `⭐ Saved Programs (${savedCount})`, callback_data: "view_saved_programs" }],
            [{ text: "📝 Update Details", callback_data: "start_registration_wizard" }],
            [{ text: "🌐 Switch Language (EN / UZ)", callback_data: "profile_switch_lang" }],
            [{ text: "🏠 Main Menu", callback_data: "go_main_menu" }],
          ],
    };

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

  bot.command("profile", async (ctx) => handleProfileMenu(ctx));
  bot.callbackQuery("menu_profile", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProfileMenu(ctx);
  });
  bot.hears([/.*My Profile.*/i, /.*Mening Profilim.*/i, /.*Profile.*/i], async (ctx) => handleProfileMenu(ctx));

  // View Saved degrees
  bot.callbackQuery("view_saved_programs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const savedIds = user.savedPrograms || [];
    const savedList = programs.filter((p) => savedIds.includes(p.id));

    await ctx.answerCallbackQuery();

    if (savedList.length === 0) {
      const emptyText = isUz
        ? `⭐ <b>Saqlangan Dasturlar</b>\n\nSiz hali hech qaysi ta'lim dasturini saqlamadingiz. Ta'lim Dasturlari bo'limiga o'tib, yoqqan dasturlarni ⭐ Saqlash tugmasi orqali belgilashingiz mumkin!`
        : `⭐ <b>Saved Programs</b>\n\nYou haven't saved any degree programs yet. Explore the Programs menu and tap ⭐ Save Program to bookmark your favorites!`;

      const emptyKb = {
        inline_keyboard: isUz
          ? [
              [{ text: "📚 Dasturlarni Ko'rish", callback_data: "back_to_progs" }],
              [{ text: "◀️ Profilga Qaytish", callback_data: "back_to_profile" }],
            ]
          : [
              [{ text: "📚 Browse Programs", callback_data: "back_to_progs" }],
              [{ text: "◀️ Back to Profile", callback_data: "back_to_profile" }],
            ],
      };

      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(emptyText, { parse_mode: "HTML", reply_markup: emptyKb });
          return;
        } catch {}
      }
      await ctx.reply(emptyText, { parse_mode: "HTML", reply_markup: emptyKb });
      return;
    }

    let text = isUz
      ? `⭐ <b>Saqlangan Ta'lim Dasturlaringiz (${savedList.length} ta):</b>\n\n`
      : `⭐ <b>Your Saved Degree Programs (${savedList.length}):</b>\n\n`;

    const buttons = savedList.map((p) => [
      {
        text: `📘 ${p.name} (${p.city})`,
        callback_data: `view_prog_${p.id}`,
      },
    ]);

    buttons.push([
      {
        text: isUz ? "◀️ Profilga Qaytish" : "◀️ Back to Profile",
        callback_data: "back_to_profile",
      },
    ]);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: buttons },
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  });

  // Switch language from profile
  bot.callbackQuery("profile_switch_lang", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(t(user.lang, "choose_language"), {
          reply_markup: getLanguageInlineKeyboard(),
        });
        return;
      } catch {}
    }
    await ctx.reply(t(user.lang, "choose_language"), {
      reply_markup: getLanguageInlineKeyboard(),
    });
  });

  // Start registration wizard from profile
  bot.callbackQuery("start_registration_wizard", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCallbackQuery();
    db.setWaitingFor(userId, "registration_name");

    const user = db.getUser(userId);
    const text =
      user.lang === "uz"
        ? `📝 <b>1-Qadam (3 tadan): To'liq Ismingiz</b>\n\nIltimos, to'liq ism va familiyangizni kiriting:`
        : `📝 <b>Step 1 of 3: Full Name</b>\n\nPlease enter your Full Name:`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
        return;
      } catch {}
    }

    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true },
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery("back_to_profile", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleProfileMenu(ctx);
  });
}
