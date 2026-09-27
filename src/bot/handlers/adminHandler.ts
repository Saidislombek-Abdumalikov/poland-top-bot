import { Bot, Context } from "grammy";
import { db } from "../services/db";
import {
  isAuthorizedAdmin,
  endAdminSession,
} from "../services/auth";
import {
  getAdminDashboardKeyboard,
  getAdminUsersListKeyboard,
  getAdminUserDetailKeyboard,
  getAdminApplicationsListKeyboard,
  getAdminApplicationDetailKeyboard,
  getAdminPendingDocsKeyboard,
  getAdminStudentDossierKeyboard,
  getAdminDocReviewKeyboard,
  getAdminUniversitiesKeyboard,
  getAdminUniversityEditKeyboard,
  getAdminDocDefsKeyboard,
  getAdminDocDefEditKeyboard,
  getAdminReviewsListKeyboard,
  getAdminReviewEditKeyboard,
  getAdminTestsListKeyboard,
  getAdminTestDetailKeyboard,
  getAdminDeleteTestConfirmKeyboard,
  getAdminOfertaPreviewKeyboard,
} from "../keyboards/adminKeyboards";
import { AppStage, DocStatus } from "../types";
import { escapeHtml } from "../utils/format";

export function setupAdminHandler(bot: Bot) {
  const checkAdminAuth = (userId?: number): boolean => {
    return isAuthorizedAdmin(userId);
  };

  const renderAdminDashboard = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    if (!checkAdminAuth(userId)) {
      db.setWaitingFor(userId, "admin_auth");
      await ctx.reply(
        "🔒 <b>Administrator Authentication Required</b>\n\n" +
          "Please enter the administration passcode to proceed:",
        { parse_mode: "HTML" }
      );
      return;
    }

    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const users = db.getAllUsers();
    const apps = db.getAllApplications();
    const pendingDocs = db.getPendingDocuments();
    const allRevs = db.getAllReviews();
    const pendingRevs = db.getPendingReviews();
    const allTests = db.getAllTests();

    const text = isUz
      ? `🎛️ <b>PTU Administrator Boshqaruv Paneli</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 <b>Tizim Statistikasi:</b>\n` +
        `• 👥 Ro'yxatdan o'tgan talabalar: <b>${users.length}</b> ta\n` +
        `• 📋 Universitet arizalari: <b>${apps.length}</b> ta\n` +
        `• 📁 Hujjatlar navbati: <b>${pendingDocs.length}</b> ta kutilmoqda\n` +
        `• ⭐ Sharhlar: <b>${allRevs.length}</b> ta (<b>${pendingRevs.length}</b> kutilmoqda)\n` +
        `• 📝 Kirish testlari: <b>${allTests.length}</b> ta material\n\n` +
        `👇 <i>Kerakli boshqaruv bo'limini tanlang:</i>`
      : `🎛️ <b>PTU Administrator Dashboard</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 <b>System Overview:</b>\n` +
        `• 👥 Registered Students: <b>${users.length}</b>\n` +
        `• 📋 University Applications: <b>${apps.length}</b>\n` +
        `• 📁 Pending Document Queue: <b>${pendingDocs.length}</b> in review\n` +
        `• ⭐ Student Reviews: <b>${allRevs.length}</b> (${pendingRevs.length} pending)\n` +
        `• 📝 Test Materials: <b>${allTests.length}</b>\n\n` +
        `👇 <i>Select an administration module below:</i>`;

    const kb = getAdminDashboardKeyboard(
      {
        usersCount: users.length,
        appsCount: apps.length,
        pendingDocsCount: pendingDocs.length,
        reviewsCount: allRevs.length,
        testsCount: allTests.length,
      },
      user.lang
    );

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }

    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  };

  bot.command("admin", async (ctx) => {
    await renderAdminDashboard(ctx);
  });

  bot.callbackQuery("admin_main", async (ctx) => {
    await ctx.answerCallbackQuery();
    await renderAdminDashboard(ctx);
  });

  bot.callbackQuery("admin_logout", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      endAdminSession(userId);
    }
    await ctx.answerCallbackQuery({ text: "Logged out successfully" });
    try {
      await ctx.editMessageText("🚪 <b>Admin session ended successfully.</b>", { parse_mode: "HTML" });
    } catch {
      await ctx.reply("🚪 <b>Admin session ended successfully.</b>", { parse_mode: "HTML" });
    }
  });

  // ================= APPLICATIONS =================
  bot.callbackQuery("admin_menu_apps", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const apps = db.getAllApplications();
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    const text = isUz
      ? `📋 <b>Universitet Arizalari Ro'yxati (${apps.length} ta)</b>\n\nBatafsil ko'rish uchun arizani tanlang:`
      : `📋 <b>University Applications (${apps.length})</b>\n\nSelect an application to view details & manage stage:`;

    const kb = getAdminApplicationsListKeyboard(apps, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_apps_page_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const page = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const apps = db.getAllApplications();
    const adminUser = db.getUser(userId!);
    const kb = getAdminApplicationsListKeyboard(apps, page, 6, adminUser.lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery(/^admin_view_app_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const appId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const app = db.getApplication(appId);
    if (!app) return;

    const student = db.getUser(app.userId);
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    const text = isUz
      ? `📋 <b>Ariza Ma'lumotlari: #${escapeHtml(app.id)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Talaba:</b> ${escapeHtml(app.studentName)}\n` +
        `📞 <b>Telefon:</b> ${escapeHtml(student.phone || "N/A")}\n` +
        `💬 <b>Telegram:</b> ${student.username ? `@${student.username}` : "N/A"} (ID: <code>${student.userId}</code>)\n` +
        `🏛️ <b>Universitet:</b> ${escapeHtml(app.university)} (${escapeHtml(app.city)})\n` +
        `🎓 <b>Dastur:</b> ${escapeHtml(app.programName)}\n` +
        `📌 <b>Bosqich / Holat:</b> <b>${escapeHtml(app.stage)}</b>\n` +
        `📅 <b>Topshirilgan:</b> ${app.submittedAt}\n` +
        (app.counselorNote ? `💬 <b>Izoh:</b> <i>"${escapeHtml(app.counselorNote)}"</i>\n` : "")
      : `📋 <b>Application Details: #${escapeHtml(app.id)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Student:</b> ${escapeHtml(app.studentName)}\n` +
        `📞 <b>Phone:</b> ${escapeHtml(student.phone || "N/A")}\n` +
        `💬 <b>Telegram:</b> ${student.username ? `@${student.username}` : "N/A"} (ID: <code>${student.userId}</code>)\n` +
        `🏛️ <b>University:</b> ${escapeHtml(app.university)} (${escapeHtml(app.city)})\n` +
        `🎓 <b>Program:</b> ${escapeHtml(app.programName)}\n` +
        `📌 <b>Stage:</b> <b>${escapeHtml(app.stage)}</b>\n` +
        `📅 <b>Submitted:</b> ${app.submittedAt}\n` +
        (app.counselorNote ? `💬 <b>Counselor Note:</b> <i>"${escapeHtml(app.counselorNote)}"</i>\n` : "");

    const kb = getAdminApplicationDetailKeyboard(app, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_set_stage_([^_]+)_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const rawStage = ctx.match[1];
    const appId = ctx.match[2];

    const stageMap: Record<string, AppStage> = {
      Processing: "Processing",
      UniversityReview: "University Review",
      Accepted: "Accepted",
      ActionNeeded: "Action Needed",
    };

    const stage = stageMap[rawStage] || "Processing";
    const updated = db.updateApplicationStage(appId, stage);
    if (!updated) return;

    await ctx.answerCallbackQuery({ text: `Status updated to: ${stage}` });

    // Notify student in background
    try {
      await bot.api.sendMessage(
        updated.userId,
        `🔔 <b>Arizangiz Holati Yangilandi!</b>\n\n` +
          `🏛️ <b>Universitet:</b> ${escapeHtml(updated.university)}\n` +
          `🎓 <b>Dastur:</b> ${escapeHtml(updated.programName)}\n` +
          `📌 <b>Yangi Holat:</b> <b>${escapeHtml(stage)}</b>`,
        { parse_mode: "HTML" }
      );
    } catch {}

    const adminUser = db.getUser(userId!);
    const kb = getAdminApplicationDetailKeyboard(updated, adminUser.lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery(/^admin_feedback_prompt_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const appId = ctx.match[1];
    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId!, "admin_feedback_app", { appId });
    await ctx.reply(
      `💬 <b>Ariza bo'yicha talabaga izoh / xabar yuborish (#${escapeHtml(appId)}):</b>\n\n` +
        `Izoh matnini yozib yuboring (talabaga to'g'ridan-to'g'ri xabarnoma boradi):`,
      { parse_mode: "HTML" }
    );
  });

  // ================= DOCUMENT QUEUE & DOSSIER =================
  bot.callbackQuery("admin_menu_docs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const pendingDocs = db.getPendingDocuments();
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    const text = isUz
      ? `📁 <b>Tekshiruv Kutilayotgan Hujjatlar Navbati</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Jami <b>${pendingDocs.length}</b> ta hujjat tekshiruvda kutilmoqda.\n` +
        `Ko'rish uchun talaba profilini tanlang:`
      : `📁 <b>Pending Document Verification Queue</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Total <b>${pendingDocs.length}</b> documents waiting for review.\n` +
        `Select a student to inspect their dossier:`;

    const kb = getAdminPendingDocsKeyboard(pendingDocs, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_queue_page_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const page = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const pendingDocs = db.getPendingDocuments();
    const adminUser = db.getUser(userId!);
    const kb = getAdminPendingDocsKeyboard(pendingDocs, page, 6, adminUser.lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery(/^admin_review_student_docs_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const studentId = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const student = db.getUser(studentId);
    const docDefs = db.getDocumentDefinitions();
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    const docs = student.documents || {};
    const hasPending = Object.values(docs).some((d) => d.status === "reviewing");

    const text = isUz
      ? `📁 <b>Talaba Hujjatlar Dosyesi: ${escapeHtml(student.fullName || student.firstName || "Student")}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📞 <b>Telefon:</b> ${escapeHtml(student.phone || "N/A")}\n` +
        `🎓 <b>Bosqich:</b> ${escapeHtml(student.preferredLevel || "Bakalavr")}\n` +
        `💬 <b>Telegram:</b> ${student.username ? `@${student.username}` : `ID ${student.userId}`}\n\n` +
        `Har bir hujjat holatini tekshirish yoki bir bosishda tasdiqlash uchun pastdagi tugmalardan foydalaning:`
      : `📁 <b>Student Document Dossier: ${escapeHtml(student.fullName || student.firstName || "Student")}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📞 <b>Phone:</b> ${escapeHtml(student.phone || "N/A")}\n` +
        `🎓 <b>Degree:</b> ${escapeHtml(student.preferredLevel || "Bachelor")}\n` +
        `💬 <b>Telegram:</b> ${student.username ? `@${student.username}` : `ID ${student.userId}`}\n\n` +
        `Inspect individual documents or approve all in one click below:`;

    const kb = getAdminStudentDossierKeyboard(student, docDefs, hasPending, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_approve_all_student_docs_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const studentId = parseInt(ctx.match[1], 10);

    const student = db.getUser(studentId);
    const docs = student.documents || {};

    let approvedCount = 0;
    Object.keys(docs).forEach((k) => {
      if (docs[k].status === "reviewing") {
        db.updateDocumentStatus(studentId, k, "approved", "Admin tomonidan tasdiqlandi");
        approvedCount++;
      }
    });

    await ctx.answerCallbackQuery({
      text: `✅ ${approvedCount} ta hujjat muvaffaqiyatli tasdiqlandi!`,
    });

    // Notify student
    try {
      await bot.api.sendMessage(
        studentId,
        `✅ <b>Tabriklaymiz! Barcha yuklangan hujjatlaringiz qabul komissiyasi tomonidan to'liq tasdiqlandi.</b>`,
        { parse_mode: "HTML" }
      );
    } catch {}

    // Refresh view
    const docDefs = db.getDocumentDefinitions();
    const adminUser = db.getUser(userId!);
    const updatedStudent = db.getUser(studentId);
    const kb = getAdminStudentDossierKeyboard(updatedStudent, docDefs, false, adminUser.lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery(/^admin_review_doc_(\d+)_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const studentId = parseInt(ctx.match[1], 10);
    const docKey = ctx.match[2];
    await ctx.answerCallbackQuery();

    const student = db.getUser(studentId);
    const doc = student.documents?.[docKey];
    const def = db.getDocumentDefinition(docKey);
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    if (!doc) {
      await ctx.reply(`⚠️ Bu hujjat hali talaba tomonidan yuklanmagan.`);
      return;
    }

    const title = def?.name[adminUser.lang] || def?.name.en || docKey;
    const text = isUz
      ? `📑 <b>Hujjat Ko'rigi: ${escapeHtml(title)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Talaba:</b> ${escapeHtml(student.fullName || student.firstName || "Student")}\n` +
        `📌 <b>Holat:</b> <b>${escapeHtml(doc.status)}</b>\n` +
        (doc.fileName ? `📁 <b>Fayl:</b> <code>${escapeHtml(doc.fileName)}</code>\n` : "") +
        (doc.link ? `🔗 <b>Havola:</b> ${escapeHtml(doc.link)}\n` : "") +
        (doc.feedbackNote ? `💬 <b>Oxirgi izoh:</b> <i>"${escapeHtml(doc.feedbackNote)}"</i>\n` : "")
      : `📑 <b>Document Inspection: ${escapeHtml(title)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Student:</b> ${escapeHtml(student.fullName || student.firstName || "Student")}\n` +
        `📌 <b>Status:</b> <b>${escapeHtml(doc.status)}</b>\n` +
        (doc.fileName ? `📁 <b>File:</b> <code>${escapeHtml(doc.fileName)}</code>\n` : "") +
        (doc.link ? `🔗 <b>Link:</b> ${escapeHtml(doc.link)}\n` : "") +
        (doc.feedbackNote ? `💬 <b>Last Note:</b> <i>"${escapeHtml(doc.feedbackNote)}"</i>\n` : "");

    const kb = getAdminDocReviewKeyboard(studentId, docKey, doc.status, adminUser.lang);

    if (doc.fileId) {
      try {
        if (doc.fileType === "photo") {
          await ctx.replyWithPhoto(doc.fileId, { caption: text, parse_mode: "HTML", reply_markup: kb });
          return;
        } else {
          await ctx.replyWithDocument(doc.fileId, { caption: text, parse_mode: "HTML", reply_markup: kb });
          return;
        }
      } catch {}
    }

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_doc_decision_(\d+)_([^_]+)_(approved|needs_correction)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const studentId = parseInt(ctx.match[1], 10);
    const docKey = ctx.match[2];
    const decision = ctx.match[3] as DocStatus;

    db.updateDocumentStatus(studentId, docKey, decision);
    await ctx.answerCallbackQuery({ text: `Hujjat holati yangilandi: ${decision}` });

    try {
      await bot.api.sendMessage(
        studentId,
        `🔔 <b>Hujjat holati yangilandi:</b> ${docKey}\n` +
          `📌 <b>Yangi holat:</b> <b>${decision === "approved" ? "✅ Tasdiqlandi" : "🔴 Tuzatish kerak"}</b>`,
        { parse_mode: "HTML" }
      );
    } catch {}

    const adminUser = db.getUser(userId!);
    const kb = getAdminDocReviewKeyboard(studentId, docKey, decision, adminUser.lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery(/^admin_doc_reject_note_(\d+)_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const studentId = parseInt(ctx.match[1], 10);
    const docKey = ctx.match[2];
    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId!, "admin_feedback_doc", { studentId, docKey });
    await ctx.reply(
      `🔴 <b>${escapeHtml(docKey)} uchun rad etish sababi / tuzatish izohini yozing:</b>\n\n` +
        `Ushbu izoh talabaga yuboriladi va hujjat holati "Tuzatish kutilmoqda" ga o'tkaziladi:`,
      { parse_mode: "HTML" }
    );
  });

  // ================= STUDENTS CRM =================
  bot.callbackQuery("admin_menu_users", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const users = db.getAllUsers();
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    const text = isUz
      ? `👥 <b>Talabalar CRM Ro'yxati (${users.length} ta talaba)</b>\n\nKo'rish yoki boshqarish uchun talabani tanlang:`
      : `👥 <b>Students CRM (${users.length} registered students)</b>\n\nSelect a student to view details:`;

    const kb = getAdminUsersListKeyboard(users, 0, 6, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_users_page_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const page = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const users = db.getAllUsers();
    const adminUser = db.getUser(userId!);
    const kb = getAdminUsersListKeyboard(users, page, 6, adminUser.lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery("admin_search_user_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId!, "admin_search_user");
    await ctx.reply(
      `🔍 <b>Talabani qidirish:</b>\n\nTalabaning ismi, telefon raqami yoki Telegram username'ini yozib yuboring:`,
      { parse_mode: "HTML" }
    );
  });

  bot.callbackQuery(/^admin_view_user_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const targetUserId = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const target = db.getUser(targetUserId);
    const adminUser = db.getUser(userId!);
    const isUz = adminUser.lang === "uz";

    const text = isUz
      ? `👤 <b>Talaba Profili: ${escapeHtml(target.fullName || target.firstName || "User")}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🆔 ID: <code>${target.userId}</code>\n` +
        `• 💬 Username: ${target.username ? `@${target.username}` : "N/A"}\n` +
        `• 📞 Telefon: ${escapeHtml(target.phone || "N/A")}\n` +
        `• 🎓 Bosqich: ${escapeHtml(target.preferredLevel || "N/A")}\n` +
        `• 📅 Ro'yxatdan o'tgan: ${target.registeredAt}\n` +
        `• ⚡ Oxirgi faollik: ${target.lastActiveAt}`
      : `👤 <b>Student Profile: ${escapeHtml(target.fullName || target.firstName || "User")}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🆔 ID: <code>${target.userId}</code>\n` +
        `• 💬 Username: ${target.username ? `@${target.username}` : "N/A"}\n` +
        `• 📞 Phone: ${escapeHtml(target.phone || "N/A")}\n` +
        `• 🎓 Degree: ${escapeHtml(target.preferredLevel || "N/A")}\n` +
        `• 📅 Registered: ${target.registeredAt}\n` +
        `• ⚡ Last Active: ${target.lastActiveAt}`;

    const kb = getAdminUserDetailKeyboard(target, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_delete_user_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const targetUserId = parseInt(ctx.match[1], 10);

    db.deleteUser(targetUserId);
    await ctx.answerCallbackQuery({ text: `Talaba #${targetUserId} o'chirildi.` });

    const users = db.getAllUsers();
    const adminUser = db.getUser(userId!);
    const kb = getAdminUsersListKeyboard(users, 0, 6, adminUser.lang);
    try {
      await ctx.editMessageText(`🗑️ <b>Talaba #${targetUserId} tizimdan muvaffaqiyatli o'chirildi.</b>`, {
        parse_mode: "HTML",
        reply_markup: kb,
      });
    } catch {}
  });

  // ================= UNIVERSITIES =================
  bot.callbackQuery("admin_menu_manage_unis", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const unis = db.getAllUniversities();
    const kb = getAdminUniversitiesKeyboard(unis, 0, 6);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(`🏛️ <b>Universitetlar Boshqaruvi (${unis.length} ta)</b>:`, {
          parse_mode: "HTML",
          reply_markup: kb,
        });
        return;
      } catch {}
    }
    await ctx.reply(`🏛️ <b>Universitetlar Boshqaruvi (${unis.length} ta)</b>:`, {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^admin_unis_page_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const page = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const unis = db.getAllUniversities();
    const kb = getAdminUniversitiesKeyboard(unis, page, 6);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery(/^admin_view_uni_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const uniId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const uni = db.getUniversity(uniId);
    if (!uni) return;

    const text =
      `🏛️ <b>${escapeHtml(uni.name)} (${escapeHtml(uni.abbr || "N/A")})</b>\n` +
      `📍 Shahar: ${escapeHtml(uni.city)}\n` +
      `🌐 Sayt: ${escapeHtml(uni.website || "N/A")}\n` +
      `💰 Kontrakt: ${escapeHtml(uni.tuition?.english || "N/A")}`;

    const kb = getAdminUniversityEditKeyboard(uni.id);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_delete_uni_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const uniId = ctx.match[1];
    db.deleteUniversity(uniId);
    await ctx.answerCallbackQuery({ text: "Universitet o'chirildi" });

    const unis = db.getAllUniversities();
    const kb = getAdminUniversitiesKeyboard(unis, 0, 6);
    try {
      await ctx.editMessageText("🏛️ <b>Universitet muvaffaqiyatli o'chirildi.</b>", {
        parse_mode: "HTML",
        reply_markup: kb,
      });
    } catch {}
  });

  // ================= DOCUMENT DEFINITIONS =================
  bot.callbackQuery("admin_menu_manage_docdefs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const defs = db.getDocumentDefinitions();
    const kb = getAdminDocDefsKeyboard(defs);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText("📑 <b>Talab Qilinadigan Hujjat Turlari:</b>", {
          parse_mode: "HTML",
          reply_markup: kb,
        });
        return;
      } catch {}
    }
    await ctx.reply("📑 <b>Talab Qilinadigan Hujjat Turlari:</b>", {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^admin_view_docdef_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const docKey = ctx.match[1];
    await ctx.answerCallbackQuery();

    const def = db.getDocumentDefinition(docKey);
    if (!def) return;

    const text =
      `📑 <b>Hujjat Turi: ${escapeHtml(def.name.uz || def.name.en)}</b>\n` +
      `🔑 Kalit: <code>${escapeHtml(def.id)}</code>\n` +
      `📌 Holat: <b>${def.required ? "Majburiy" : "Ixtiyoriy"}</b>\n` +
      `📖 Tavsif: ${escapeHtml(def.desc.uz || def.desc.en)}`;

    const kb = getAdminDocDefEditKeyboard(def.id, def.required);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_toggle_docdef_req_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const docKey = ctx.match[1];

    const def = db.getDocumentDefinition(docKey);
    if (def) {
      def.required = !def.required;
      db.saveDocumentDefinition(def);
      await ctx.answerCallbackQuery({ text: `Holat yangilandi: ${def.required ? "Majburiy" : "Ixtiyoriy"}` });
      const kb = getAdminDocDefEditKeyboard(def.id, def.required);
      try {
        await ctx.editMessageReplyMarkup({ reply_markup: kb });
      } catch {}
    }
  });

  // ================= REVIEWS =================
  bot.callbackQuery("admin_menu_reviews", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const reviews = db.getAllReviews();
    const kb = getAdminReviewsListKeyboard(reviews, 0, 6);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(`⭐ <b>Talabalar Sharhlari (${reviews.length} ta):</b>`, {
          parse_mode: "HTML",
          reply_markup: kb,
        });
        return;
      } catch {}
    }
    await ctx.reply(`⭐ <b>Talabalar Sharhlari (${reviews.length} ta):</b>`, {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^admin_view_rev_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const revId = parseInt(ctx.match[1], 10);
    await ctx.answerCallbackQuery();

    const rev = db.getAllReviews().find((r) => r.id === revId);
    if (!rev) return;

    const text =
      `⭐ <b>Sharh #${rev.id} — ${escapeHtml(rev.name)}</b>\n` +
      `🏛️ ${escapeHtml(rev.university)} (${escapeHtml(rev.program)})\n` +
      `⭐ Baho: <b>${rev.rating}/5</b>\n` +
      `📌 Holat: <b>${rev.status}</b>\n\n` +
      `💬 <i>"${escapeHtml(rev.text.uz || rev.text.en)}"</i>`;

    const kb = getAdminReviewEditKeyboard(rev);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_rev_decision_(\d+)_(approve|reject)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const revId = parseInt(ctx.match[1], 10);
    const decision = ctx.match[2];

    const updated = db.updateReviewStatus(revId, decision === "approve" ? "approved" : "pending");
    await ctx.answerCallbackQuery({ text: `Sharh holati: ${decision === "approve" ? "Tasdiqlandi" : "Kutilmoqda"}` });

    if (updated) {
      const kb = getAdminReviewEditKeyboard(updated);
      try {
        await ctx.editMessageReplyMarkup({ reply_markup: kb });
      } catch {}
    }
  });

  bot.callbackQuery(/^admin_delete_rev_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const revId = parseInt(ctx.match[1], 10);

    db.deleteReview(revId);
    await ctx.answerCallbackQuery({ text: "Sharh o'chirildi" });

    const reviews = db.getAllReviews();
    const kb = getAdminReviewsListKeyboard(reviews, 0, 6);
    try {
      await ctx.editMessageText("⭐ <b>Sharh muvaffaqiyatli o'chirildi.</b>", {
        parse_mode: "HTML",
        reply_markup: kb,
      });
    } catch {}
  });

  // ================= TEST MATERIALS =================
  bot.callbackQuery("admin_menu_tests", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const tests = db.getAllTests();
    const kb = getAdminTestsListKeyboard(tests);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(`📝 <b>Kirish Testlari & Materiallar (${tests.length} ta):</b>`, {
          parse_mode: "HTML",
          reply_markup: kb,
        });
        return;
      } catch {}
    }
    await ctx.reply(`📝 <b>Kirish Testlari & Materiallar (${tests.length} ta):</b>`, {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery(/^admin_view_test_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const testId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const test = db.getTest(testId);
    if (!test) return;

    const text =
      `📝 <b>Test: ${escapeHtml(test.title.uz || test.title.en)}</b>\n` +
      `📚 Fan: ${escapeHtml(test.subject)}\n` +
      (test.fileName ? `📁 Fayl: <code>${escapeHtml(test.fileName)}</code>\n` : "") +
      (test.fileUrl ? `🔗 Havola: ${escapeHtml(test.fileUrl)}\n` : "") +
      `📅 Qo'shilgan: ${test.createdAt}`;

    const kb = getAdminTestDetailKeyboard(test);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_del_test_confirm_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const testId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const kb = getAdminDeleteTestConfirmKeyboard(testId);
    await ctx.editMessageText(
      `⚠️ <b>Haqiqatan ham ushbu test materialini o'chirmoqchimisiz?</b>\nID: <code>${escapeHtml(testId)}</code>`,
      { parse_mode: "HTML", reply_markup: kb }
    );
  });

  bot.callbackQuery(/^admin_del_test_execute_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    const testId = ctx.match[1];

    db.deleteTest(testId);
    await ctx.answerCallbackQuery({ text: "Test o'chirildi" });

    const tests = db.getAllTests();
    const kb = getAdminTestsListKeyboard(tests);
    await ctx.editMessageText("📝 <b>Test materiali muvaffaqiyatli o'chirildi.</b>", {
      parse_mode: "HTML",
      reply_markup: kb,
    });
  });

  bot.callbackQuery("admin_add_test", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId!, "admin_add_test_title");
    await ctx.reply(
      "📝 <b>Yangi test materiali qo'shish (1/3):</b>\n\nTest to'plami sarlavhasini kiriting (masalan: <i>Polsha Tibbiyot Universiteti Biologiya Testlari 2025</i>):",
      { parse_mode: "HTML" }
    );
  });

  // ================= OFERTA =================
  bot.callbackQuery("admin_preview_oferta", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    const oferta = db.getPublishedOferta();
    const adminUser = db.getUser(userId!);
    const text =
      `📄 <b>AMALDAGI OMMAVIY OFERTA (Versiya #${oferta.version})</b>\n` +
      `📅 Chop etilgan: ${oferta.publishedAt}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${oferta.text}\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    const kb = getAdminOfertaPreviewKeyboard(adminUser.lang === "uz");
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery("admin_edit_oferta_text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId!, "admin_edit_oferta_text");
    await ctx.reply(
      "✏️ <b>Ommaviy Oferta yangi matnini yuboring:</b>\n\nYangi matn darhol talabalar uchun kuchga kiradi.",
      { parse_mode: "HTML" }
    );
  });

  // ================= BROADCAST =================
  bot.callbackQuery("admin_broadcast_start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!checkAdminAuth(userId)) return;
    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId!, "admin_broadcast_text");
    await ctx.reply(
      "📢 <b>Barcha talabalarga global xabar yuborish:</b>\n\nYubormoqchi bo'lgan xabaringiz matnini kiriting:",
      { parse_mode: "HTML" }
    );
  });
}
