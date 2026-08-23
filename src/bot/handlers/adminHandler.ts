import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { config, isAdminUser } from "../config";
import {
  getAdminDashboardKeyboard,
  getAdminUsersListKeyboard,
  getAdminUserDetailKeyboard,
  getAdminApplicationsListKeyboard,
  getAdminApplicationDetailKeyboard,
  getAdminPendingDocsKeyboard,
  getAdminDocReviewKeyboard,
  getAdminPromoCodesKeyboard,
  getAdminPromoDetailKeyboard,
  getAdminUniversitiesKeyboard,
  getAdminUniversityEditKeyboard,
  getAdminDocDefsKeyboard,
  getAdminDocDefEditKeyboard,
  getAdminReviewsListKeyboard,
  getAdminReviewEditKeyboard,
} from "../keyboards/adminKeyboards";
import { AppStage, DocStatus, Language } from "../types";
import { escapeHtml } from "../utils/format";

export function setupAdminHandler(bot: Bot) {
  // Helper to check authorization
  const checkAdminAuth = (userId?: number): boolean => {
    if (!userId) return false;
    const user = db.getUser(userId);
    return user.isAdmin || isAdminUser(userId);
  };

  // Main admin dashboard render
  const renderAdminDashboard = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) {
      await ctx.reply(
        "🔒 <b>Admin Access Required</b>\n\n" +
          "Please provide the admin passcode using:\n<code>/admin &lt;passcode&gt;</code>",
        { parse_mode: "HTML" }
      );
      return;
    }

    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const users = db.getAllUsers();
    const apps = db.getAllApplications();
    const pendingDocs = db.getPendingDocuments();
    const nawaApps = db.getAllNawaApplications();
    const allRevs = db.getAllReviews();
    const pendingRevs = db.getPendingReviews();

    const text = isUz
      ? `🎛️ <b>PTU Administrator CRM Paneli</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 <b>Tizim Statistikasi:</b>\n` +
        `• 👥 Ro'yxatdan o'tgan talabalar: <b>${users.length}</b> ta\n` +
        `• 📋 Universitet arizalari: <b>${apps.length}</b> ta\n` +
        `• 📁 Tasdiqlash kutilayotgan hujjatlar: <b>${pendingDocs.length}</b> ta\n` +
        `• 🏛️ NAWA arizalari: <b>${nawaApps.length}</b> ta\n` +
        `• ⭐ Talabalar sharhlari: <b>${allRevs.length} ta (${pendingRevs.length} ta kutilmoqda)</b>\n\n` +
        `<i>Boshqarish uchun quyidagi bo'limlardan birini tanlang:</i>`
      : `🎛️ <b>PTU Admin CRM Dashboard</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 <b>Live System Overview:</b>\n` +
        `• 👥 Registered Students: <b>${users.length}</b>\n` +
        `• 📋 University Applications: <b>${apps.length}</b>\n` +
        `• 📁 Documents Awaiting Review: <b>${pendingDocs.length}</b>\n` +
        `• 🏛️ NAWA Applications: <b>${nawaApps.length}</b>\n` +
        `• ⭐ Student Reviews: <b>${allRevs.length} (${pendingRevs.length} pending)</b>\n\n` +
        `<i>Select a management section below:</i>`;

    const kb = getAdminDashboardKeyboard(
      {
        usersCount: users.length,
        appsCount: apps.length,
        pendingDocsCount: pendingDocs.length,
        nawaCount: nawaApps.length,
        reviewsCount: allRevs.length,
      },
      user.lang
    );

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

  // /admin command with optional passcode argument
  bot.command("admin", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      await ctx.deleteMessage();
    } catch {}

    const text = ctx.message?.text || "";
    const args = text.split(" ").slice(1);
    const passedCode = args[0]?.trim();

    if (passedCode && passedCode === config.adminPasscode) {
      db.updateUser(userId, { isAdmin: true });
      await ctx.reply("✅ <b>Admin access unlocked successfully!</b>", { parse_mode: "HTML" });
    }

    await renderAdminDashboard(ctx);
  });

  bot.callbackQuery("admin_main", async (ctx) => {
    await ctx.answerCallbackQuery();
    await renderAdminDashboard(ctx);
  });

  bot.callbackQuery("admin_refresh", async (ctx) => {
    const userId = ctx.from?.id;
    const user = userId ? db.getUser(userId) : undefined;
    await ctx.answerCallbackQuery({ text: user?.lang === "uz" ? "Statistika yangilandi" : "Refreshed live statistics" });
    await renderAdminDashboard(ctx);
  });

  // Admin Switch Language
  bot.callbackQuery("admin_switch_lang", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const user = db.getUser(userId);
    const newLang: Language = user.lang === "uz" ? "en" : "uz";
    db.setLanguage(userId, newLang);

    await ctx.answerCallbackQuery({
      text: newLang === "uz" ? "Admin tili: O'zbekcha 🇺🇿" : "Admin language: English 🇬🇧",
    });
    await renderAdminDashboard(ctx);
  });

  // ================= 1. USERS CRM =================
  bot.callbackQuery("admin_menu_users", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const users = db.getAllUsers();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `👥 <b>Talabalar CRM Bazasi (${users.length} nafar talaba)</b>\n\n` +
        `<i>Aloqa ma'lumotlari, hujjatlar, arizalar va VIP promokod berish uchun talabani tanlang:</i>`
      : `👥 <b>Student CRM Database (${users.length} registered students)</b>\n\n` +
        `<i>Tap any student below to view full contact info, uploaded documents, applications, or assign a VIP promo code:</i>`;

    const kb = getAdminUsersListKeyboard(users, 0, 6, adminUser.lang);

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
  });

  bot.callbackQuery(/^admin_users_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_users_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : undefined;
    const isUz = adminUser?.lang === "uz";
    const users = db.getAllUsers();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      isUz
        ? `👥 <b>Talabalar CRM Bazasi (${users.length} nafar talaba)</b>\n\n<i>${page + 1}-sahifa:</i>`
        : `👥 <b>Student CRM Database (${users.length} registered students)</b>\n\n<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminUsersListKeyboard(users, page, 6, adminUser?.lang),
      }
    );
  });

  bot.callbackQuery("admin_search_user_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);

    db.setWaitingFor(userId, "admin_search_user");
    await ctx.answerCallbackQuery();
    const promptText = adminUser.lang === "uz"
      ? "🔍 <b>Talabani Qidirish:</b>\nTalabaning Ismi, Username yoki Telefon raqamini yuboring:"
      : "🔍 <b>Search Student:</b>\nPlease send the student's Full Name, Username, or Phone:";

    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // View specific user profile details
  bot.callbackQuery(/^admin_view_user_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_user_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    const isUz = adminUser?.lang === "uz";

    const apps = db.getUserApplications(targetUserId);
    const docs = user.documents || {};
    const verifiedDocs = Object.values(docs).filter((d) => d.status === "approved").length;

    let appsSummary = isUz ? "Mavjud emas" : "None";
    if (apps.length > 0) {
      appsSummary = apps.map((a) => `• #${a.id} ${a.programName} (${a.university}) — [${a.stage}]`).join("\n");
    }

    const text = isUz
      ? `👤 <b>Talaba Ma'lumotlari: ${escapeHtml(user.fullName || user.firstName || `Foydalanuvchi #${user.userId}`)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🆔 User ID: <code>${user.userId}</code>\n` +
        `• 👤 Username: ${user.username ? `@${escapeHtml(user.username)}` : "<i>(mavjud emas)</i>"}\n` +
        `• 📞 Telefon: <code>${escapeHtml(user.phone || "kiritilmagan")}</code>\n` +
        `• 🎓 Bosqich: <b>${escapeHtml(user.preferredLevel || "Bakalavr")}</b>\n` +
        `• 💎 A'zolik: <b>${user.isPremium ? `💎 ${user.premiumTier}` : "⚪ Oddiy Talaba"}</b>\n` +
        `• 📁 Tasdiqlangan Hujjatlar: <b>${verifiedDocs} / ${Object.keys(docs).length || 7}</b>\n` +
        `• 📅 Ro'yxatdan o'tgan: ${escapeHtml(user.registeredAt)}\n` +
        `• ⏱️ Oxirgi faollik: ${escapeHtml(user.lastActiveAt)}\n\n` +
        `📋 <b>Universitet Arizalari (${apps.length}):</b>\n${escapeHtml(appsSummary)}`
      : `👤 <b>Student Dossier: ${escapeHtml(user.fullName || user.firstName || `User #${user.userId}`)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🆔 User ID: <code>${user.userId}</code>\n` +
        `• 👤 Username: ${user.username ? `@${escapeHtml(user.username)}` : "<i>(none)</i>"}\n` +
        `• 📞 Phone: <code>${escapeHtml(user.phone || "not provided")}</code>\n` +
        `• 🎓 Target Degree: <b>${escapeHtml(user.preferredLevel || "Not specified")}</b>\n` +
        `• 💎 Membership: <b>${user.isPremium ? `💎 ${user.premiumTier}` : "⚪ Free Student"}</b>\n` +
        `• 📁 Verified Docs: <b>${verifiedDocs} / ${Object.keys(docs).length || 7}</b>\n` +
        `• 📅 Registered: ${escapeHtml(user.registeredAt)}\n` +
        `• ⏱️ Last Active: ${escapeHtml(user.lastActiveAt)}\n\n` +
        `📋 <b>University Applications (${apps.length}):</b>\n${escapeHtml(appsSummary)}`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminUserDetailKeyboard(user, adminUser?.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminUserDetailKeyboard(user, adminUser?.lang),
    });
  });

  // Assign VIP promo to user
  bot.callbackQuery(/^admin_assign_promo_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_assign_promo_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);

    const promo = db.generatePersonalPromo(
      targetUserId,
      user.fullName || user.firstName || `User #${targetUserId}`,
      "Full Premium"
    );

    await ctx.answerCallbackQuery({ text: `VIP Code ${promo.code} created!` });

    // Send code notification to student directly
    try {
      await bot.api.sendMessage(
        targetUserId,
        `🎁 <b>Admissions Consultant Gift!</b>\n\n` +
          `An advisor assigned you an exclusive Single-Use VIP Promo Code:\n` +
          `🔑 <code>${escapeHtml(promo.code)}</code>\n\n` +
          `Tap <b>💎 Premium A'zolik</b> in the bot menu to activate your full admissions package!`,
        { parse_mode: "HTML" }
      );
    } catch {}

    await ctx.reply(
      `✅ <b>Exclusive Single-Use Promo Code Generated & Sent to Student!</b>\n\n` +
        `• 👤 Student: <b>${escapeHtml(user.fullName || user.firstName || "")}</b> (<code>${targetUserId}</code>)\n` +
        `• 🔑 Code: <code>${escapeHtml(promo.code)}</code>\n` +
        `• 💎 Tier: <b>${escapeHtml(promo.tier)}</b>`,
      {
        parse_mode: "HTML",
      }
    );
  });

  // Toggle Admin status
  bot.callbackQuery(/^admin_toggle_admin_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_toggle_admin_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);
    const newStatus = !user.isAdmin;

    db.updateUser(targetUserId, { isAdmin: newStatus });
    await ctx.answerCallbackQuery({ text: `Admin role ${newStatus ? "granted" : "revoked"}` });

    const updatedUser = db.getUser(targetUserId);
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminUserDetailKeyboard(updatedUser, adminUser?.lang),
    });
  });

  // ================= 2. APPLICATIONS CRM =================
  bot.callbackQuery("admin_menu_apps", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const apps = db.getAllApplications();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `📋 <b>Universitet Arizalari Boshqaruvi (${apps.length} ta)</b>\n\n` +
        `<i>Qabul bosqichini o'zgartirish yoki talabaga izoh yuborish uchun arizani tanlang:</i>`
      : `📋 <b>University Applications Management (${apps.length} total)</b>\n\n` +
        `<i>Tap any application below to update admission stage or send counselor notes to the student:</i>`;

    const kb = getAdminApplicationsListKeyboard(apps, 0, 6, adminUser.lang);

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
  });

  bot.callbackQuery(/^admin_apps_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_apps_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : undefined;
    const apps = db.getAllApplications();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz"
        ? `📋 <b>Universitet Arizalari (${apps.length} ta)</b>\n\n<i>${page + 1}-sahifa:</i>`
        : `📋 <b>University Applications (${apps.length} total)</b>\n\n<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminApplicationsListKeyboard(apps, page, 6, adminUser?.lang),
      }
    );
  });

  // View Application Details
  bot.callbackQuery(/^admin_view_app_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_app_(.+)$/);
    if (!match) return;
    const appId = match[1];
    const app = db.getApplication(appId);
    if (!app) return;

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    const isUz = adminUser?.lang === "uz";
    const student = db.getUser(app.userId);

    const text = isUz
      ? `📋 <b>Ariza Ma'lumotlari #${escapeHtml(app.id)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 👤 Talaba: <b>${escapeHtml(app.studentName)}</b> (<code>${app.userId}</code>)\n` +
        `• 📞 Telefon: <code>${escapeHtml(student.phone || "kiritilmagan")}</code>\n` +
        `• 🏛️ Universitet: <b>${escapeHtml(app.university)}</b> (${escapeHtml(app.city)})\n` +
        `• 📘 Dastur: <b>${escapeHtml(app.programName)}</b>\n` +
        `• 📌 Bosqich: <code>${escapeHtml(app.stage)}</code>\n` +
        (app.counselorNote ? `• 💬 Maslahatchi Izohi: <i>"${escapeHtml(app.counselorNote)}"</i>\n` : "") +
        `• 📅 Topshirilgan: ${escapeHtml(app.submittedAt)}\n` +
        `• ⏱️ Yangilangan: ${escapeHtml(app.updatedAt)}\n\n` +
        `<i>Qabul bosqichini tanlang:</i>`
      : `📋 <b>Application Dossier #${escapeHtml(app.id)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 👤 Student: <b>${escapeHtml(app.studentName)}</b> (<code>${app.userId}</code>)\n` +
        `• 📞 Phone: <code>${escapeHtml(student.phone || "not set")}</code>\n` +
        `• 🏛️ University: <b>${escapeHtml(app.university)}</b> (${escapeHtml(app.city)})\n` +
        `• 📘 Program: <b>${escapeHtml(app.programName)}</b>\n` +
        `• 📌 Stage: <code>${escapeHtml(app.stage)}</code>\n` +
        (app.counselorNote ? `• 💬 Counselor Note: <i>"${escapeHtml(app.counselorNote)}"</i>\n` : "") +
        `• 📅 Submitted: ${escapeHtml(app.submittedAt)}\n` +
        `• ⏱️ Updated: ${escapeHtml(app.updatedAt)}\n\n` +
        `<i>Change the admission stage below:</i>`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminApplicationDetailKeyboard(app, adminUser?.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminApplicationDetailKeyboard(app, adminUser?.lang),
    });
  });

  // Update Application Stage
  bot.callbackQuery(/^admin_set_stage_([^_]+)_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_set_stage_([^_]+)_(.+)$/);
    if (!match) return;
    const appId = match[1];
    const newStage = match[2] as AppStage;

    const app = db.updateApplicationStage(appId, newStage);
    await ctx.answerCallbackQuery({ text: `Stage updated to ${newStage}` });

    if (app) {
      // Notify student in Telegram
      try {
        await bot.api.sendMessage(
          app.userId,
          `🔔 <b>Application Status Update!</b>\n\n` +
            `Your application for <b>${escapeHtml(app.programName)}</b> at <b>${escapeHtml(app.university)}</b> is now:\n` +
            `📌 <b>${escapeHtml(newStage)}</b>\n\n` +
            `Check your profile to view counselor instructions.`,
          { parse_mode: "HTML" }
        );
      } catch {}

      const adminId = ctx.from?.id;
      const adminUser = adminId ? db.getUser(adminId) : undefined;
      await ctx.editMessageText(
        `✅ Application <b>${escapeHtml(app.id)}</b> updated to <b>${escapeHtml(newStage)}</b> and student notified!`,
        {
          parse_mode: "HTML",
          reply_markup: getAdminApplicationDetailKeyboard(app, adminUser?.lang),
        }
      );
    }
  });

  // Send Custom Note prompt
  bot.callbackQuery(/^admin_feedback_prompt_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_feedback_prompt_(.+)$/);
    if (!match) return;
    const appId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_feedback_app", { appId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `💬 <b>Send Counselor Note for Application #${escapeHtml(appId)}:</b>\n\n` +
        `Type the feedback or missing requirements message you want to send to the student:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // ================= 3. DOCUMENTS REVIEW =================
  bot.callbackQuery("admin_menu_docs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const pendingList = db.getPendingDocuments();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `📁 <b>Hujjatlarni Tekshirish Navbati (${pendingList.length} ta kutilmoqda)</b>\n\n` +
        `<i>Hujjatni ko'rish, tasdiqlash yoki qayta yuklash talab qilish uchun tanlang:</i>`
      : `📁 <b>Documents Verification Queue (${pendingList.length} pending review)</b>\n\n` +
        `<i>Tap any document below to view submitted files, approve, or request corrections:</i>`;

    const kb = getAdminPendingDocsKeyboard(pendingList, adminUser.lang);

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
  });

  // View single submitted document
  bot.callbackQuery(/^admin_review_doc_(\d+)_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_review_doc_(\d+)_(.+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const docKey = match[2];

    const student = db.getUser(targetUserId);
    const doc = student.documents?.[docKey];
    if (!doc) return;

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    const isUz = adminUser?.lang === "uz";

    let fileContentDesc = isUz ? "Fayl biriktirilmagan" : "No file attached";
    if (doc.link) {
      fileContentDesc = `🔗 <b>${isUz ? "Havola" : "Submitted Link"}:</b> <a href="${escapeHtml(doc.link)}">${escapeHtml(doc.link)}</a>`;
    } else if (doc.fileId) {
      fileContentDesc = `📁 <b>${isUz ? "Fayl Nomi" : "File Name"}:</b> <code>${escapeHtml(doc.fileName || "File")}</code> (Type: ${doc.fileType})`;
    }

    const text =
      `📁 <b>Review Document: ${escapeHtml(docKey.toUpperCase())}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• 👤 Student: <b>${escapeHtml(student.fullName || student.firstName || "")}</b> (<code>${targetUserId}</code>)\n` +
      `• 📞 Phone: <code>${escapeHtml(student.phone || "not set")}</code>\n` +
      `• 📌 Status: <b>${escapeHtml(doc.status.toUpperCase())}</b>\n` +
      `• 📅 Updated: ${escapeHtml(doc.updatedAt)}\n\n` +
      `${fileContentDesc}\n\n` +
      `<i>Choose an action below:</i>`;

    await ctx.answerCallbackQuery();

    if (doc.fileId) {
      try {
        if (doc.fileType === "photo") {
          await ctx.replyWithPhoto(doc.fileId, {
            caption: `📷 Photo for ${escapeHtml(docKey)} from ${escapeHtml(student.fullName || "")}`,
            parse_mode: "HTML",
          });
        } else {
          await ctx.replyWithDocument(doc.fileId, {
            caption: `📄 Document ${escapeHtml(doc.fileName || "")} for ${escapeHtml(docKey)}`,
            parse_mode: "HTML",
          });
        }
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminDocReviewKeyboard(targetUserId, docKey, adminUser?.lang),
    });
  });

  // Decision on document
  bot.callbackQuery(/^admin_doc_decision_(\d+)_([^_]+)_(approved|needs_correction)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_doc_decision_(\d+)_([^_]+)_(approved|needs_correction)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const docKey = match[2];
    const decision = match[3] as DocStatus;

    db.verifyDocument(targetUserId, docKey, decision);
    const isApproved = decision === "approved";

    await ctx.answerCallbackQuery({ text: isApproved ? "Document Approved!" : "Correction requested" });

    // Notify student
    try {
      if (isApproved) {
        await bot.api.sendMessage(
          targetUserId,
          `✅ <b>Document Verified!</b>\n\nYour <b>${escapeHtml(docKey.toUpperCase())}</b> has been approved by admissions advisors.`,
          { parse_mode: "HTML" }
        );
      } else {
        await bot.api.sendMessage(
          targetUserId,
          `🔴 <b>Document Correction Required!</b>\n\nYour <b>${escapeHtml(docKey.toUpperCase())}</b> requires revision. Please re-upload in the Document Checklist.`,
          { parse_mode: "HTML" }
        );
      }
    } catch {}

    await ctx.editMessageText(
      `✅ Document <b>${escapeHtml(docKey)}</b> for student <code>${targetUserId}</code> marked as <b>${decision.toUpperCase()}</b>!`,
      { parse_mode: "HTML" }
    );
  });

  // Rejection with custom note
  bot.callbackQuery(/^admin_doc_reject_note_(\d+)_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_doc_reject_note_(\d+)_(.+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const docKey = match[2];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_feedback_doc", { targetUserId, docKey });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `💬 <b>Rejection Note for ${escapeHtml(docKey.toUpperCase())}:</b>\n\n` +
        `Send the explanation of what needs to be fixed:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // ================= 4. PROMO CODES CRM =================
  bot.callbackQuery("admin_menu_promos", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const promos = db.getAllPromoCodes();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `⚡ <b>Promokodlar va Grantlar Boshqaruvi (${promos.length} ta kod)</b>\n\n` +
        `<i>Promokod tafsilotlarini ko'rish, o'chirish yoki yangi tasodifiy bir martalik kod yaratish:</i>`
      : `⚡ <b>Promo Codes & Grants Manager (${promos.length} codes)</b>\n\n` +
        `<i>Tap any promo code to view details, delete, expire or reactivate it, or generate a new random code:</i>`;

    const kb = getAdminPromoCodesKeyboard(promos, 0, 6, adminUser.lang);

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
  });

  // 1-Click Generate Random Code (Strictly 1 Student Single-Use)
  bot.callbackQuery("admin_gen_random_promo", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    const promo = db.createPromoCode({
      tier: "Full Premium",
      maxUses: 1, // Strictly 1 person
    });

    await ctx.answerCallbackQuery({ text: `Single-use code ${promo.code} generated!` });
    await ctx.reply(
      `⚡ <b>New Single-Use Promo Code Generated!</b>\n\n` +
        `• 🔑 Code: <code>${escapeHtml(promo.code)}</code>\n` +
        `• 💎 Tier: <b>${escapeHtml(promo.tier)}</b>\n` +
        `• 👥 Max Uses: <b>1 (Single Student Exclusive)</b>\n` +
        `• 🟢 Status: <b>ACTIVE (Available)</b>\n\n` +
        `<i>Give this code to 1 student. As soon as it is entered, it is consumed and immediately becomes unavailable.</i>`,
      {
        parse_mode: "HTML",
      }
    );
  });

  // View specific promo code details
  bot.callbackQuery(/^admin_view_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];
    const promo = db.getPromoCode(codeKey);
    if (!promo) return;

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    const statusBadge = promo.isExpired || !promo.isActive ? "🔴 EXPIRED / INACTIVE" : "🟢 ACTIVE";

    const text =
      `🔑 <b>Promo Code Details: <code>${escapeHtml(promo.code)}</code></b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• 📌 Status: <b>${statusBadge}</b>\n` +
      `• 💎 Tier: <b>${escapeHtml(promo.tier)}</b>\n` +
      `• 👥 Uses: <b>${promo.usedCount} / ${promo.maxUses}</b>\n` +
      `• 📅 Created: ${escapeHtml(promo.createdAt)}\n` +
      (promo.assignedUserName ? `• 👤 Assigned to: <b>${escapeHtml(promo.assignedUserName)}</b> (<code>${promo.assignedUserId}</code>)\n` : "") +
      (promo.usedByUserName ? `• ✅ Redeemed by: <b>${escapeHtml(promo.usedByUserName)}</b> on ${escapeHtml(promo.usedAt)}\n` : "") +
      (promo.expiresAt ? `• ⏳ Expiry Date: ${escapeHtml(promo.expiresAt)}\n` : "");

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminPromoDetailKeyboard(promo, adminUser?.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminPromoDetailKeyboard(promo, adminUser?.lang),
    });
  });

  // Expire code
  bot.callbackQuery(/^admin_expire_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_expire_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];

    db.expirePromoCode(codeKey);
    const promo = db.getPromoCode(codeKey);

    await ctx.answerCallbackQuery({ text: `Code ${codeKey} expired!` });
    await ctx.reply(`🔴 Code <code>${escapeHtml(codeKey)}</code> is now <b>EXPIRED / DEACTIVATED</b>. Students can no longer redeem it.`, {
      parse_mode: "HTML",
    });
  });

  // Reactivate code
  bot.callbackQuery(/^admin_reactivate_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_reactivate_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];

    db.reactivatePromoCode(codeKey);
    const promo = db.getPromoCode(codeKey);

    await ctx.answerCallbackQuery({ text: `Code ${codeKey} reactivated!` });
    await ctx.reply(`🟢 Code <code>${escapeHtml(codeKey)}</code> is now <b>ACTIVE</b> again and can be redeemed by students.`, {
      parse_mode: "HTML",
    });
  });

  // Permanently Delete Promo Code
  bot.callbackQuery(/^admin_delete_promo_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_promo_(.+)$/);
    if (!match) return;
    const codeKey = match[1];

    db.deletePromoCode(codeKey);

    await ctx.answerCallbackQuery({ text: `Code ${codeKey} deleted permanently!` });
    await ctx.reply(`🗑️ Promo code <code>${escapeHtml(codeKey)}</code> has been <b>permanently deleted</b> from the database.`, {
      parse_mode: "HTML",
    });

    const promos = db.getAllPromoCodes();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    await ctx.reply(
      `⚡ <b>Promo Codes & Grants Manager (${promos.length} codes)</b>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminPromoCodesKeyboard(promos, 0, 6, adminUser?.lang),
      }
    );
  });

  bot.callbackQuery("admin_create_promo_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_create_promo");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `➕ <b>Create Custom Promo Code</b>\n\n` +
        `Please send in the format: <code>&lt;CODE&gt; &lt;TIER&gt; &lt;MAX_USES&gt;</code>\n` +
        `<i>Example (Single Student):</i> <code>PTU-VIP-GOLD Full Premium 1</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // ================= 5. UNIVERSITIES MANAGEMENT =================
  bot.callbackQuery("admin_menu_manage_unis", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const unis = db.getAllUniversities();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `🏛️ <b>Polsha Universitetlari Bazasi (${unis.length} ta oliygoh)</b>\n\n` +
        `<i>Rasmiy veb-sayt havolasini o'zgartirish, kontrakt narxini tahrirlash yoki universitetni o'chirish uchun tanlang:</i>`
      : `🏛️ <b>Polish Universities Database (${unis.length} institutions)</b>\n\n` +
        `<i>Tap any university to edit official website URL link, tuition, or delete it from the bot:</i>`;

    const kb = getAdminUniversitiesKeyboard(unis, 0, 6, adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_unis_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_unis_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : undefined;
    const unis = db.getAllUniversities();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz"
        ? `🏛️ <b>Polsha Universitetlari Bazasi (${unis.length} ta oliygoh)</b>\n\n<i>${page + 1}-sahifa:</i>`
        : `🏛️ <b>Polish Universities Database (${unis.length} institutions)</b>\n\n<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminUniversitiesKeyboard(unis, page, 6, adminUser?.lang),
      }
    );
  });

  bot.callbackQuery(/^admin_view_uni_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_uni_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const uni = db.getUniversity(uniId);
    if (!uni) return;

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;

    const text =
      `🏛️ <b>University Details: ${escapeHtml(uni.name)} (${escapeHtml(uni.abbr)})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• 🆔 ID: <code>${escapeHtml(uni.id)}</code>\n` +
      `• 📍 City: <b>${escapeHtml(uni.city)}</b>\n` +
      `• 🏫 Type: <b>${escapeHtml(uni.type)}</b>\n` +
      `• 🏆 Ranking: <b>${escapeHtml(uni.ranking)}</b>\n` +
      `• 🌐 Website Link: <a href="${escapeHtml(uni.website)}">${escapeHtml(uni.website)}</a>\n` +
      `• 💰 English Tuition: <b>${escapeHtml(uni.tuition.english)}</b>\n` +
      `• 💰 Non-EU Tuition: <b>${escapeHtml(uni.tuition.nonEu)}</b>\n` +
      `• 📅 Deadline: <b>${escapeHtml(uni.deadline)}</b>\n`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminUniversityEditKeyboard(uni, adminUser?.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminUniversityEditKeyboard(uni, adminUser?.lang),
    });
  });

  bot.callbackQuery("admin_add_uni_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_add_university");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `➕ <b>Add New University</b>\n\n` +
        `Please send in the format:\n<code>&lt;ID&gt; | &lt;NAME&gt; | &lt;ABBR&gt; | &lt;CITY&gt; | &lt;TYPE(Public/Private)&gt; | &lt;RANKING&gt; | &lt;TUITION&gt; | &lt;WEBSITE_URL&gt;</code>\n\n` +
        `<i>Example:</i>\n<code>cue | Cracow University of Economics | CUE | Kraków | Public | #12 | 2,200 EUR/yr | https://uek.krakow.pl</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_uni_web_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_uni_web_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_edit_uni_web", { uniId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `🌐 <b>Update Website Link for ${escapeHtml(uniId)}:</b>\n\nSend the new official website URL (e.g. <code>https://en.uw.edu.pl</code>):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_uni_tui_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_uni_tui_(.+)$/);
    if (!match) return;
    const uniId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_edit_uni_tui", { uniId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `💰 <b>Update Tuition Fee for ${escapeHtml(uniId)}:</b>\n\nSend the new tuition fee text (e.g. <code>2,400 EUR / year</code>):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_delete_uni_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_uni_(.+)$/);
    if (!match) return;
    const uniId = match[1];

    db.deleteUniversity(uniId);
    await ctx.answerCallbackQuery({ text: `University ${uniId} deleted!` });
    await ctx.reply(`🗑️ University <code>${escapeHtml(uniId)}</code> has been deleted.`, { parse_mode: "HTML" });

    const unis = db.getAllUniversities();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    await ctx.reply(`🏛️ <b>Polish Universities Database (${unis.length} institutions)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminUniversitiesKeyboard(unis, 0, 6, adminUser?.lang),
    });
  });

  // ================= 6. DOCUMENT REQUIREMENTS MANAGEMENT =================
  bot.callbackQuery("admin_menu_manage_docdefs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const docDefs = db.getDocumentDefinitions();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `📑 <b>Hujjat Talablari Turlari (${Object.keys(docDefs).length} ta tur)</b>\n\n` +
        `<i>Majburiy yoki ixtiyoriy qilish, yoki o'chirish uchun hujjat turini tanlang:</i>`
      : `📑 <b>Document Checklist Requirements (${Object.keys(docDefs).length} types)</b>\n\n` +
        `<i>Tap any document requirement to toggle mandatory/optional status or delete it:</i>`;

    const kb = getAdminDocDefsKeyboard(docDefs, adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_view_docdef_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_docdef_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const def = db.getDocumentDefinition(docKey);
    if (!def) return;

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;

    const text =
      `📑 <b>Document Requirement: ${escapeHtml(def.name.en)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• 🆔 Key: <code>${escapeHtml(def.id)}</code>\n` +
      `• 🇬🇧 Name (EN): <b>${escapeHtml(def.name.en)}</b>\n` +
      `• 🇺🇿 Name (UZ): <b>${escapeHtml(def.name.uz)}</b>\n` +
      `• ⭐ Mandatory: <b>${def.required ? "YES (Required)" : "NO (Optional)"}</b>\n` +
      `• 📝 Description (EN): <i>${escapeHtml(def.desc.en)}</i>\n` +
      `• 📝 Description (UZ): <i>${escapeHtml(def.desc.uz)}</i>\n`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminDocDefEditKeyboard(def, adminUser?.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminDocDefEditKeyboard(def, adminUser?.lang),
    });
  });

  bot.callbackQuery(/^admin_toggle_docdef_req_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_toggle_docdef_req_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const def = db.getDocumentDefinition(docKey);
    if (!def) return;

    def.required = !def.required;
    db.saveDocumentDefinition(def);

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;

    await ctx.answerCallbackQuery({ text: `Requirement set to ${def.required ? "Required" : "Optional"}` });
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminDocDefEditKeyboard(def, adminUser?.lang),
    });
  });

  bot.callbackQuery(/^admin_delete_docdef_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_docdef_(.+)$/);
    if (!match) return;
    const docKey = match[1];

    db.deleteDocumentDefinition(docKey);
    await ctx.answerCallbackQuery({ text: `Document type ${docKey} deleted!` });
    await ctx.reply(`🗑️ Document type <code>${escapeHtml(docKey)}</code> deleted.`, { parse_mode: "HTML" });

    const docDefs = db.getDocumentDefinitions();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    await ctx.reply(`📑 <b>Document Checklist Requirements (${Object.keys(docDefs).length} types)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminDocDefsKeyboard(docDefs, adminUser?.lang),
    });
  });

  bot.callbackQuery("admin_add_docdef_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_add_docdef");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `➕ <b>Add New Document Type</b>\n\n` +
        `Please send in the format:\n<code>&lt;KEY&gt; | &lt;NAME_EN&gt; | &lt;NAME_UZ&gt; | &lt;DESC_EN&gt; | &lt;DESC_UZ&gt; | &lt;REQUIRED(yes/no)&gt;</code>\n\n` +
        `<i>Example:</i>\n<code>medical_cert | Medical Certificate | Tibbiy Ma'lumotnoma | General health fitness certificate | O'qishga yaroqlilik haqidagi tibbiy ma'lumotnoma | yes</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // ================= 7. REVIEWS MANAGEMENT =================
  bot.callbackQuery("admin_menu_reviews", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const revs = db.getAllReviews();
    const pending = db.getPendingReviews();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `⭐ <b>Talabalar Sharhlari Boshqaruvi (${revs.length} ta jami, ${pending.length} ta tasdiq kutilmoqda)</b>\n\n` +
        `<i>Tasdiqlash, matn/bahoni tahrirlash yoki o'chirish uchun sharhni tanlang:</i>`
      : `⭐ <b>Student Reviews & Testimonials (${revs.length} total, ${pending.length} pending)</b>\n\n` +
        `<i>Tap any review to approve, edit text/rating, or delete it:</i>`;

    const kb = getAdminReviewsListKeyboard(revs, 0, 6, adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_revs_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_revs_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : undefined;
    const revs = db.getAllReviews();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz"
        ? `⭐ <b>Talabalar Sharhlari (${revs.length} ta)</b>\n\n<i>${page + 1}-sahifa:</i>`
        : `⭐ <b>Student Reviews (${revs.length} total)</b>\n\n<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminReviewsListKeyboard(revs, page, 6, adminUser?.lang),
      }
    );
  });

  bot.callbackQuery(/^admin_view_rev_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_rev_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const rev = db.getReview(revId);
    if (!rev) return;

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    const statusBadge = rev.status === "approved" ? "🟢 APPROVED & PUBLISHED" : "🟡 PENDING MODERATION";

    const text =
      `⭐ <b>Review #${rev.id} Dossier</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• 📌 Status: <b>${statusBadge}</b>\n` +
      `• 👤 Student: <b>${escapeHtml(rev.name)}</b> (${escapeHtml(rev.country)})\n` +
      `• 🏛️ University: <b>${escapeHtml(rev.university)}</b>\n` +
      `• 📘 Program: <b>${escapeHtml(rev.program)}</b> (${escapeHtml(rev.year)})\n` +
      `• ⭐ Rating: <b>${"⭐".repeat(rev.rating)} (${rev.rating}/5)</b>\n` +
      `• 📅 Date: ${escapeHtml(rev.submittedAt)}\n\n` +
      `💬 <b>Review Text (EN):</b>\n<i>"${escapeHtml(rev.text.en)}"</i>\n\n` +
      `💬 <b>Review Text (UZ):</b>\n<i>"${escapeHtml(rev.text.uz)}"</i>\n`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang),
    });
  });

  bot.callbackQuery(/^admin_rev_decision_(\d+)_(approve|reject)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_rev_decision_(\d+)_(approve|reject)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const isApprove = match[2] === "approve";

    db.moderateReview(revId, isApprove);
    await ctx.answerCallbackQuery({ text: isApprove ? "Review Published!" : "Review Rejected & Deleted" });

    const rev = db.getReview(revId);
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;

    if (rev && isApprove) {
      await ctx.editMessageText(
        `✅ Review #${revId} approved and published live to all students!`,
        {
          parse_mode: "HTML",
          reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang),
        }
      );
    } else {
      await ctx.editMessageText(`🗑️ Review #${revId} rejected and removed from database.`, {
        parse_mode: "HTML",
      });
      const revs = db.getAllReviews();
      await ctx.reply(`⭐ <b>Student Reviews & Testimonials (${revs.length} total)</b>`, {
        parse_mode: "HTML",
        reply_markup: getAdminReviewsListKeyboard(revs, 0, 6, adminUser?.lang),
      });
    }
  });

  bot.callbackQuery("admin_add_rev_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_add_review");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `➕ <b>Add New Student Review / Testimonial</b>\n\n` +
        `Please send in the format:\n<code>&lt;NAME&gt; | &lt;COUNTRY&gt; | &lt;UNIVERSITY&gt; | &lt;PROGRAM&gt; | &lt;RATING(1-5)&gt; | &lt;TEXT_EN&gt; | &lt;TEXT_UZ&gt;</code>\n\n` +
        `<i>Example:</i>\n<code>Shoxrux Bek | Uzbekistan | Kozminski University | Finance (B.Sc) | 5 | Outstanding faculty and campus! | Ajoyib ta'lim va zamonaviy kampus!</code>`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_rev_text_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_rev_text_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_edit_review_text", { revId });
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `✏️ <b>Edit Text for Review #${revId}:</b>\n\nSend the updated review text:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_rev_rating_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_rev_rating_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);
    const rev = db.getReview(revId);
    if (!rev) return;

    rev.rating = rev.rating <= 1 ? 5 : rev.rating - 1;
    db.updateReview(revId, { rating: rev.rating });

    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;

    await ctx.answerCallbackQuery({ text: `Rating set to ${rev.rating}⭐` });
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminReviewEditKeyboard(rev, adminUser?.lang),
    });
  });

  bot.callbackQuery(/^admin_delete_rev_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_rev_(\d+)$/);
    if (!match) return;
    const revId = parseInt(match[1], 10);

    db.deleteReview(revId);
    await ctx.answerCallbackQuery({ text: `Review #${revId} deleted!` });
    await ctx.reply(`🗑️ Review #${revId} deleted from database.`, { parse_mode: "HTML" });

    const revs = db.getAllReviews();
    const adminId = ctx.from?.id;
    const adminUser = adminId ? db.getUser(adminId) : undefined;
    await ctx.reply(`⭐ <b>Student Reviews & Testimonials (${revs.length} total)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminReviewsListKeyboard(revs, 0, 6, adminUser?.lang),
    });
  });

  // ================= 8. BROADCAST ANNOUNCEMENTS =================
  bot.callbackQuery("admin_broadcast_start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;

    db.setWaitingFor(userId, "admin_broadcast_text");
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      `📢 <b>Global Student Broadcast</b>\n\n` +
        `Send the announcement message you want to broadcast to all registered students in the bot:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
}
