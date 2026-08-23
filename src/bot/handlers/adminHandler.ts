import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { config } from "../config";
import {
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
  authenticatePasscode,
  startAdminSession,
  endAdminSession,
  grantAdminRole,
  revokeAdminRole,
  getEffectiveActor,
} from "../services/auth";
import {
  getAdminDashboardKeyboard,
  getAdminUsersListKeyboard,
  getAdminUserDetailKeyboard,
  getAdminApplicationsListKeyboard,
  getAdminApplicationDetailKeyboard,
  getAdminPendingDocsKeyboard,
  getAdminDocReviewKeyboard,
  getAdminPromoCodesKeyboard,
  getAdminPromoProductSelectKeyboard,
  getAdminPromoDetailKeyboard,
  getAdminUniversitiesKeyboard,
  getAdminUniversityEditKeyboard,
  getAdminDocDefsKeyboard,
  getAdminDocDefEditKeyboard,
  getAdminReviewsListKeyboard,
  getAdminReviewEditKeyboard,
  getSuperAdminDashboardKeyboard,
  getSuperAdminFinancialHQKeyboard,
  getSuperAdminTransactionsKeyboard,
  getSuperAdminTransactionDetailKeyboard,
  getSuperAdminLogsKeyboard,
  getSuperAdminAdminsKeyboard,
  getSuperAdminDbStatusKeyboard,
  getAdminOfertaPricingKeyboard,
  getAdminOfertaPreviewKeyboard,
  getSuperAdminPurgeTransactionsConfirmKeyboard,
  getSuperAdminClearLogsConfirmKeyboard,
  getAdminTestsListKeyboard,
  getAdminTestDetailKeyboard,
  getAdminDeleteTestConfirmKeyboard,
} from "../keyboards/adminKeyboards";
import { AppStage, DocStatus, Language } from "../types";
import { escapeHtml } from "../utils/format";

export function setupAdminHandler(bot: Bot) {
  // Helper to check authorization server-side
  const checkAdminAuth = (userId?: number): boolean => {
    return isAuthorizedAdmin(userId);
  };

  const checkSuperAdminAuth = (userId?: number): boolean => {
    return isAuthorizedSuperAdmin(userId);
  };

  // Main admin dashboard render
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
    const nawaApps = db.getAllNawaApplications();
    const allRevs = db.getAllReviews();
    const pendingRevs = db.getPendingReviews();

    const isSuper = checkSuperAdminAuth(userId);

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
        adminsCount: db.getAllAdmins(isSuper).length,
        auditLogsCount: isSuper ? db.getAuditLogs().length : undefined,
      },
      user.lang,
      isSuper
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

  // Super Admin Headquarters render helper
  const renderSuperAdminHQ = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.reply("⛔ <b>Access Denied:</b> You do not have permission to perform this action.", { parse_mode: "HTML" });
      return;
    }
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const allAdmins = db.getAllAdmins(true);
    const auditLogs = db.getAuditLogs(100);
    const allUsers = db.getAllUsers();

    const text = isUz
      ? `👑 <b>SUPER ADMIN BOSHQARMASI (MAXFIY)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔒 <b>Peak Access Level:</b> Super Administrator (Boss)\n` +
        `🆔 Sizning ID: <code>${userId}</code> (Tizim egasi)\n\n` +
        `📊 <b>Nazorat Ko'rsatkichlari:</b>\n` +
        `• 🛡️ Faol Oddiy Adminlar: <b>${allAdmins.filter(a => !a.isSuperAdmin && a.adminRole !== "super_admin").length}</b> ta\n` +
        `• 📜 Yozilgan Audit Loglar: <b>${auditLogs.length}</b> ta\n` +
        `• 👥 Jami Talabalar Bazasi: <b>${allUsers.length}</b> ta\n` +
        `• 🗄️ Cloud DB Sync: <b>Supabase PostgreSQL (Live)</b>\n\n` +
        `<i>Bu bo'lim faqat sizga ko'rinadi. Oddiy adminlar sizning mavjudligingizni bilmaydi.</i>`
      : `👑 <b>SUPER ADMIN HEADQUARTERS (MASTER)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔒 <b>Peak Access Level:</b> Super Administrator (Boss)\n` +
        `🆔 Your Telegram ID: <code>${userId}</code> (Master Owner)\n\n` +
        `📊 <b>System Master Overview:</b>\n` +
        `• 🛡️ Active Regular Admins: <b>${allAdmins.filter(a => !a.isSuperAdmin && a.adminRole !== "super_admin").length}</b>\n` +
        `• 📜 Recorded Audit Logs: <b>${auditLogs.length}</b>\n` +
        `• 👥 Total User Database: <b>${allUsers.length}</b>\n` +
        `• 🗄️ Cloud Storage: <b>Supabase PostgreSQL (Live)</b>\n\n` +
        `<i>This command center is 100% invisible to regular admins.</i>`;

    const kb = getSuperAdminDashboardKeyboard(
      {
        adminsCount: allAdmins.length,
        auditLogsCount: auditLogs.length,
        usersCount: allUsers.length,
      },
      adminUser.lang
    );

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  };

  // 1. Unified /admin Command
  bot.command("admin", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Immediately delete the message so passcode is never visible in chat history
    try {
      await ctx.deleteMessage();
    } catch {}

    const text = ctx.message?.text || "";
    const args = text.trim().split(/\s+/).slice(1);
    const passedCode = args.join(" ").trim();

    if (passedCode) {
      const role = authenticatePasscode(passedCode);
      if (role === "super_admin") {
        startAdminSession(userId, "super_admin");
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Super Admin",
          "SUPER_ADMIN_LOGIN",
          "Authenticated into Super Admin session via /admin command",
          undefined,
          "super_admin"
        );
        await ctx.reply("👑 <b>Super Admin Access Granted!</b>\n\nWelcome, Boss.", { parse_mode: "HTML" });
        await renderAdminDashboard(ctx);
        return;
      } else if (role === "admin") {
        startAdminSession(userId, "admin");
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Admin",
          "ADMIN_LOGIN",
          "Authenticated into Normal Admin session via /admin command",
          undefined,
          "admin"
        );
        await ctx.reply("✅ <b>Administrator Access Granted!</b>", { parse_mode: "HTML" });
        await renderAdminDashboard(ctx);
        return;
      } else {
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Unknown",
          "FAILED_LOGIN_ATTEMPT",
          "Failed login attempt with invalid passcode",
          undefined,
          "admin",
          "failure"
        );
        await ctx.reply("⛔ <b>Authentication Failed:</b> Invalid credentials.", { parse_mode: "HTML" });
        return;
      }
    }

    // No passcode in command: Check if session is already authenticated
    if (checkAdminAuth(userId)) {
      await renderAdminDashboard(ctx);
    } else {
      db.setWaitingFor(userId, "admin_auth");
      await ctx.reply(
        "🔒 <b>Administrator Authentication Required</b>\n\n" +
          "Please enter your administration passcode to proceed:",
        { parse_mode: "HTML" }
      );
    }
  });

  // 2. Secret /superadmin Command
  bot.command("superadmin", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      await ctx.deleteMessage();
    } catch {}

    const text = ctx.message?.text || "";
    const args = text.trim().split(/\s+/).slice(1);
    const passedCode = args.join(" ").trim();

    if (passedCode) {
      const role = authenticatePasscode(passedCode);
      if (role === "super_admin") {
        startAdminSession(userId, "super_admin");
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Super Admin",
          "SUPER_ADMIN_LOGIN",
          "Authenticated into Super Admin HQ via /superadmin command",
          undefined,
          "super_admin"
        );
        await ctx.reply("👑 <b>Super Admin Master Access Granted!</b>\n\nWelcome, Boss.", { parse_mode: "HTML" });
        await renderSuperAdminHQ(ctx);
        return;
      } else {
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Unknown",
          "FAILED_LOGIN_ATTEMPT",
          "Failed superadmin login attempt",
          undefined,
          "super_admin",
          "failure"
        );
        await ctx.reply("⛔ <b>Authentication Failed:</b> Invalid credentials.", { parse_mode: "HTML" });
        return;
      }
    }

    if (checkSuperAdminAuth(userId)) {
      await renderSuperAdminHQ(ctx);
    } else {
      db.setWaitingFor(userId, "admin_auth");
      await ctx.reply(
        "🔒 <b>Authentication Required</b>\n\nPlease enter your passcode:",
        { parse_mode: "HTML" }
      );
    }
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
    if (!adminId || !checkAdminAuth(adminId)) return;
    const isSuper = checkSuperAdminAuth(adminId);

    // Invisibility protection: Normal Admins CANNOT view Super Admin accounts
    if (!isSuper && (user.isSuperAdmin || user.adminRole === "super_admin")) {
      await ctx.answerCallbackQuery({ text: "User not found" });
      return;
    }

    const adminUser = db.getUser(adminId);
    const isUz = adminUser?.lang === "uz";

    const apps = db.getUserApplications(targetUserId);
    const docs = user.documents || {};
    const verifiedDocs = Object.values(docs).filter((d) => d.status === "approved").length;

    let appsSummary = isUz ? "Mavjud emas" : "None";
    if (apps.length > 0) {
      appsSummary = apps.map((a) => `• #${a.id} ${a.programName} (${a.university}) — [${a.stage}]`).join("\n");
    }

    let superFinancialAudit = "";
    if (isSuper && user.isPremium) {
      superFinancialAudit = isUz
        ? `\n\n💰 <b>Maxfiy Moliyaviy Audit (Faqat Super Admin):</b>\n` +
          `• 📌 Berilish Asosi: <b>${user.premiumGrantReason || (user.premiumCode ? "PROMO_CODE" : "VERIFIED_PAYMENT")}</b>\n` +
          `• 🧾 Tranzaksiya ID: <code>${user.premiumTransactionId || "N/A"}</code>\n` +
          `• 🔑 Promokod: <code>${user.premiumCode || "N/A"}</code>\n` +
          `• ⏱️ Tasdiqlangan: ${user.premiumVerifiedAt || user.registeredAt}\n` +
          (user.premiumVerifiedBy ? `• 👤 Tasdiqlagan: <code>Admin #${user.premiumVerifiedBy}</code>\n` : "")
        : `\n\n💰 <b>Private Financial Audit (Super Admin Only):</b>\n` +
          `• 📌 Grant Reason: <b>${user.premiumGrantReason || (user.premiumCode ? "PROMO_CODE" : "VERIFIED_PAYMENT")}</b>\n` +
          `• 🧾 Transaction ID: <code>${user.premiumTransactionId || "N/A"}</code>\n` +
          `• 🔑 Promo Code: <code>${user.premiumCode || "N/A"}</code>\n` +
          `• ⏱️ Verified At: ${user.premiumVerifiedAt || user.registeredAt}\n` +
          (user.premiumVerifiedBy ? `• 👤 Verified By: <code>Admin #${user.premiumVerifiedBy}</code>\n` : "");
    }

    const text = (isUz
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
        `📋 <b>University Applications (${apps.length}):</b>\n${escapeHtml(appsSummary)}`) + superFinancialAudit;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getAdminUserDetailKeyboard(user, adminUser?.lang, isSuper),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getAdminUserDetailKeyboard(user, adminUser?.lang, isSuper),
    });
  });

  // Assign VIP promo to user
  bot.callbackQuery(/^admin_assign_promo_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_assign_promo_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);

    // 1. Create single-use promo code specifically for student
    const promo = db.generatePersonalPromo(
      targetUserId,
      user.fullName || user.firstName || `User #${targetUserId}`,
      "NAWA_FULL",
      adminId
    );

    // 2. Automatically redeem and activate Full Application + NAWA on the student's profile!
    db.redeemPromoCode(promo.code, targetUserId);
    const pricing = db.getPricingConfig();

    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "GRANT_VIP_PREMIUM",
      `Directly granted & activated Full Application + NAWA ($${pricing.fullApplicationNawaPrice}) via code '${promo.code}' for Student #${targetUserId} (${user.fullName || user.username || "Student"})`,
      promo.code
    );

    await ctx.answerCallbackQuery({ text: `Full Application + NAWA activated for ${user.fullName || targetUserId}!` });

    // 3. Send instant celebration notification to student directly
    const isUz = user.lang === "uz";
    const studentText = isUz
      ? `🎉 <b>TABRIKLAYMIZ! QABUL MASLAHATCHISI SIZGA TO'LIQ PREMIUM TAQDIM ETDI!</b>\n\n` +
        `Sizning hisobingizga <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice})</b> paketi to'g'ridan-to'g'ri faollashtirildi!\n\n` +
        `🔑 <b>Promokod:</b> <code>${escapeHtml(promo.code)}</code> (Avtomatik faollashtirildi ✅)\n\n` +
        `✨ <b>Ochilgan Imkoniyatlar:</b>\n` +
        `• 📁 Barcha kerakli hujjatlarni tekshiruvga yuklash va tasdiqlatish\n` +
        `• 🏛️ Universitet arizalarini to'liq yuritish va topshirish\n` +
        `• 💶 <b>€${pricing.applicationFee} Rasmiy Ariza To'lovi (Application Fee) shu paket ichida to'liq qoplangan (biz to'laymiz)</b>\n` +
        `• 📜 NAWA SYRENA va Polsha qasamyodli tarjimalari (Tłumacz Przysięgły) ko'magi\n` +
        `• 💬 Shaxsiy qabul koordinatori bilan doimiy 1-ga-1 aloqa\n\n` +
        `<i>Hujjatlaringizni yuklashni boshlash uchun quyidagi tugmani bosing:</i>`
      : `🎉 <b>CONGRATULATIONS! ADMISSIONS ADVISOR GRANTED YOU FULL PREMIUM!</b>\n\n` +
        `The <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice})</b> package has been activated directly on your account!\n\n` +
        `🔑 <b>Promo Code:</b> <code>${escapeHtml(promo.code)}</code> (Auto-activated ✅)\n\n` +
        `✨ <b>Unlocked Features:</b>\n` +
        `• 📁 Full Document Verification & Advisor Checklist\n` +
        `• 🏛️ Direct University Application Processing\n` +
        `• 💶 <b>€${pricing.applicationFee} Official University Application Fee is INCLUDED (covered by our team)</b>\n` +
        `• 📜 NAWA SYRENA & Sworn Translations (Tłumacz Przysięgły)\n` +
        `• 💬 1-on-1 Dedicated Admissions Consultant Support\n\n` +
        `<i>Tap below to access your document checklist:</i>`;

    try {
      await bot.api.sendMessage(targetUserId, studentText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: isUz ? "📁 Hujjatlarni Yuklash" : "📁 Document Checklist", callback_data: "menu_docs" }],
            [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
          ],
        },
      });
    } catch {}

    const updatedTarget = db.getUser(targetUserId);

    await ctx.reply(
      `✅ <b>Full Application + NAWA Paketi Talabaga To'g'ridan-to'g'ri Faollashtirildi!</b>\n\n` +
        `• 👤 <b>Talaba:</b> <b>${escapeHtml(user.fullName || user.firstName || "Student")}</b> (<code>${targetUserId}</code>)\n` +
        `• 🔑 <b>Promokod:</b> <code>${escapeHtml(promo.code)}</code>\n` +
        `• 💎 <b>Paket:</b> <b>Full Application + NAWA ($${pricing.fullApplicationNawaPrice}) — Faol ✅</b>\n` +
        `• 💳 <b>Tranzaksiya:</b> <code>${updatedTarget.premiumTransactionId || "PAID"}</code>\n\n` +
        `<i>Talabaga faollashtirish xabari va hujjatlarni yuklash tugmalari yuborildi.</i>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: isUz ? "◀️ Talabalar Ro'yxatiga" : "◀️ Back to Students", callback_data: "admin_menu_users" }],
          ],
        },
      }
    );
  });

  // Toggle Admin status (Strictly Super Admin ONLY)
  bot.callbackQuery(/^admin_toggle_admin_(\d+)$/, async (ctx) => {
    const adminId = ctx.from?.id || 0;
    if (!checkSuperAdminAuth(adminId)) {
      await ctx.answerCallbackQuery({ text: "⛔ You do not have permission to perform this action." });
      return;
    }

    const match = ctx.callbackQuery?.data?.match(/^admin_toggle_admin_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);
    const user = db.getUser(targetUserId);

    if (user.isSuperAdmin || user.adminRole === "super_admin") {
      await ctx.answerCallbackQuery({ text: "⛔ This account's role cannot be modified." });
      return;
    }

    const newStatus = !user.isAdmin;
    db.updateUser(targetUserId, { isAdmin: newStatus, adminRole: newStatus ? "admin" : null });

    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      newStatus ? "GRANT_ADMIN" : "REVOKE_ADMIN",
      `${newStatus ? "Granted" : "Revoked"} Admin role for User #${targetUserId} (${user.fullName || user.username || "User"})`,
      `User #${targetUserId}`,
      "super_admin"
    );

    await ctx.answerCallbackQuery({ text: `Admin role ${newStatus ? "granted" : "revoked"}` });

    const updatedUser = db.getUser(targetUserId);
    await ctx.editMessageReplyMarkup({
      reply_markup: getAdminUserDetailKeyboard(updatedUser, adminUser?.lang, true),
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
      const adminId = ctx.from?.id || 0;
      const adminUser = db.getUser(adminId);
      db.logAdminAction(
        adminId,
        adminUser.fullName || adminUser.username || `Admin #${adminId}`,
        "UPDATE_APP_STAGE",
        `Changed Application #${appId} (${app.programName} at ${app.university}) stage to '${newStage}' for Student #${app.userId}`,
        `App #${appId}`
      );

      // Notify student in Telegram
      try {
        const student = db.getUser(app.userId);
        const isUz = student.lang === "uz";

        const stageUzMap: Record<string, string> = {
          "Applied": "Ariza topshirildi 📝",
          "Under Review": "Oliygohda ko'rib chiqilmoqda 🔍",
          "Accepted": "Qabul qilindi 🎉",
          "Action Needed": "Qo'shimcha harakat talab etiladi ⚠️",
          "Visa Stage": "Viza bosqichi ✈️",
          "Rejected": "Rad etildi ❌",
        };
        const stageDisplay = isUz ? (stageUzMap[newStage] || newStage) : newStage;

        const studentMsg = isUz
          ? `🔔 <b>Ariza Holati Yangilandi!</b>\n\n` +
            `Sizning <b>${escapeHtml(app.university)}</b> universitetidagi <b>${escapeHtml(app.programName)}</b> yo'nalishi bo'yicha arizangiz holati:\n` +
            `📌 <b>${escapeHtml(stageDisplay)}</b>\n\n` +
            `Batafsil ma'lumot va ko'rsatmalar bilan arizalar bo'limida tanishing.`
          : `🔔 <b>Application Status Update!</b>\n\n` +
            `Your application for <b>${escapeHtml(app.programName)}</b> at <b>${escapeHtml(app.university)}</b> is now:\n` +
            `📌 <b>${escapeHtml(stageDisplay)}</b>\n\n` +
            `Check your profile to view counselor instructions.`;

        await bot.api.sendMessage(
          app.userId,
          studentMsg,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: isUz ? "📋 Mening Arizalarim" : "📋 My Applications", callback_data: "menu_status" }],
              ],
            },
          }
        );
      } catch {}

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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    const student = db.getUser(targetUserId);

    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "REVIEW_DOCUMENT",
      `Document '${docKey}' for Student #${targetUserId} (${student.fullName || student.username || "Student"}) marked as '${decision.toUpperCase()}'`,
      `User #${targetUserId}`
    );

    await ctx.answerCallbackQuery({ text: isApproved ? "Document Approved!" : "Correction requested" });

    // Notify student in their native language
    try {
      const isUz = student.lang === "uz";
      const docDef = db.getDocumentDefinition(docKey);
      const docName = docDef ? (docDef.name[student.lang] || docDef.name.en) : docKey;

      if (isApproved) {
        const studentMsg = isUz
          ? `✅ <b>Hujjatingiz Tasdiqlandi!</b>\n\n` +
            `Siz yuklagan <b>${escapeHtml(docName)}</b> qabul maslahatchilari tomonidan muvaffaqiyatli tekshirildi va tasdiqlandi.`
          : `✅ <b>Document Verified!</b>\n\n` +
            `Your <b>${escapeHtml(docName)}</b> has been approved by admissions advisors.`;

        await bot.api.sendMessage(targetUserId, studentMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: isUz ? "📁 Hujjatlar Ro'yxati" : "📁 Document Checklist", callback_data: "menu_docs" }],
            ],
          },
        });
      } else {
        const studentMsg = isUz
          ? `🔴 <b>Hujjatga Tuzatish Talab Qilinadi!</b>\n\n` +
            `Siz yuklagan <b>${escapeHtml(docName)}</b> bo'yicha kamchiliklar aniqlandi. Iltimos, talablarga muvofiq qayta yuklang.`
          : `🔴 <b>Document Correction Required!</b>\n\n` +
            `Your <b>${escapeHtml(docName)}</b> requires revision. Please re-upload your document.`;

        await bot.api.sendMessage(targetUserId, studentMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: isUz ? "🔄 Qayta Yuklash (To'g'rilash)" : "🔄 Re-upload Document", callback_data: `doc_upload_prompt_${docKey}` }],
              [{ text: isUz ? "📁 Hujjatlar Ro'yxati" : "📁 Document Checklist", callback_data: "menu_docs" }],
            ],
          },
        });
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

  // Promo product selection menu
  bot.callbackQuery("admin_create_promo_select", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const pricing = db.getPricingConfig();

    const text = isUz
      ? `➕ <b>Yangi Promokod Yaratish</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Qaysi mahsulot/paket uchun tasodifiy 8 xonali promokod yaratmoqchisiz?\n\n` +
        `• <b>1. NAWA — $${pricing.nawaPrice}:</b> Standart NAWA SYRENA arizasi va yo'riqnomasi\n` +
        `• <b>2. Full Application + NAWA — $${pricing.fullApplicationNawaPrice}:</b> To'liq hujjatlar tekshiruvi va universitet arizalari`
      : `➕ <b>Create New Promo Code</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Select the package to generate a secure random 8-character promo code for:\n\n` +
        `• <b>1. NAWA — $${pricing.nawaPrice}:</b> Standard NAWA SYRENA guidance\n` +
        `• <b>2. Full Application + NAWA — $${pricing.fullApplicationNawaPrice}:</b> Full document verification & university admissions`;

    await ctx.answerCallbackQuery();
    const kb = getAdminPromoProductSelectKeyboard(adminUser.lang, pricing);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  // Create promo code for selected tier (NAWA or NAWA_FULL)
  bot.callbackQuery(/^admin_create_promo_tier_(NAWA|NAWA_FULL)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const match = ctx.callbackQuery?.data?.match(/^admin_create_promo_tier_(NAWA|NAWA_FULL)$/);
    if (!match) return;
    const tier = match[1] as "NAWA" | "NAWA_FULL";

    const adminUser = db.getUser(userId);
    const promo = db.createPromoCode({
      tier,
      maxUses: 1,
      createdBy: userId,
      createdByName: adminUser.fullName || adminUser.username || `Admin #${userId}`,
    });

    const isUz = adminUser.lang === "uz";
    const pricing = db.getPricingConfig();
    const tierName = tier === "NAWA" ? `NAWA ($${pricing.nawaPrice})` : `Full Application + NAWA ($${pricing.fullApplicationNawaPrice})`;

    await ctx.answerCallbackQuery({ text: `Code ${promo.code} created for ${tierName}!` });

    const text = isUz
      ? `✅ <b>Yangi Bir Martalik Promokod Yaratildi!</b>\n\n` +
        `• 🔑 <b>Promokod:</b> <code>${escapeHtml(promo.code)}</code>\n` +
        `• 💎 <b>Paket:</b> <b>${escapeHtml(tierName)}</b>\n` +
        `• 👥 <b>Maksimal Foydalanish:</b> <b>1 ta talaba (Single-use)</b>\n` +
        `• 🟢 <b>Holati:</b> <b>Faol (Active)</b>\n\n` +
        `<i>Ushbu 8 xonali kodni talabaga yuboring. Kod kiritilishi bilan sarflanadi va band qilinadi.</i>`
      : `✅ <b>New Single-Use Promo Code Generated!</b>\n\n` +
        `• 🔑 <b>Promo Code:</b> <code>${escapeHtml(promo.code)}</code>\n` +
        `• 💎 <b>Package:</b> <b>${escapeHtml(tierName)}</b>\n` +
        `• 👥 <b>Max Uses:</b> <b>1 Student Exclusive (Single-use)</b>\n` +
        `• 🟢 <b>Status:</b> <b>Active</b>\n\n` +
        `<i>Send this 8-character code to the student. As soon as it is redeemed, it is locked.</i>`;

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: isUz ? "➕ Yana Kod Yaratish" : "➕ Generate Another Code", callback_data: "admin_create_promo_select" }],
          [{ text: isUz ? "◀️ Promokodlar Ro'yxatiga" : "◀️ Back to Promo Codes", callback_data: "admin_menu_promos" }],
        ],
      },
    });
  });

  // Promo codes pagination
  bot.callbackQuery(/^admin_promos_page_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_promos_page_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    const adminUser = userId ? db.getUser(userId) : undefined;
    const promos = db.getAllPromoCodes();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      adminUser?.lang === "uz"
        ? `⚡ <b>Promokodlar va Grantlar Boshqaruvi (${promos.length} ta kod)</b>\n\n<i>${page + 1}-sahifa:</i>`
        : `⚡ <b>Promo Codes & Grants Manager (${promos.length} codes)</b>\n\n<i>Page ${page + 1}:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminPromoCodesKeyboard(promos, page, 6, adminUser?.lang),
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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "EXPIRE_PROMO",
      `Deactivated/Expired promo code '${codeKey}'`,
      codeKey
    );

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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "REACTIVATE_PROMO",
      `Reactivated promo code '${codeKey}'`,
      codeKey
    );

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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "DELETE_PROMO",
      `Permanently deleted promo code '${codeKey}'`,
      codeKey
    );

    await ctx.answerCallbackQuery({ text: `Code ${codeKey} deleted permanently!` });
    await ctx.reply(`🗑️ Promo code <code>${escapeHtml(codeKey)}</code> has been <b>permanently deleted</b> from the database.`, {
      parse_mode: "HTML",
    });

    const promos = db.getAllPromoCodes();
    const adminUserUpdated = db.getUser(adminId);
    await ctx.reply(
      `⚡ <b>Promo Codes & Grants Manager (${promos.length} codes)</b>`,
      {
        parse_mode: "HTML",
        reply_markup: getAdminPromoCodesKeyboard(promos, 0, 6, adminUserUpdated?.lang),
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

  // ================= OFERTA & PRICING MANAGEMENT (SUPER ADMIN ONLY) =================
  bot.callbackQuery("admin_menu_oferta_pricing", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Only Super Admin can manage Oferta & Pricing." });
      return;
    }
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const pricing = db.getPricingConfig();
    const oferta = db.getPublishedOferta();
    const draft = db.getDraftOferta();
    const hasDraft = draft && draft.status === "draft" && draft.text !== oferta.text;

    const text = isUz
      ? `📄 <b>OFERTA VA NARXLARNI BOSHQARISH (SUPER ADMIN HQ)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 <b>Amaldagi Narxlar (Yagona Manba):</b>\n` +
        `• 📦 <b>NAWA Paketi:</b> <code>$${pricing.nawaPrice} ${pricing.nawaCurrency}</code>\n` +
        `• 💎 <b>Full Application + NAWA:</b> <code>$${pricing.fullApplicationNawaPrice} ${pricing.fullApplicationNawaCurrency}</code>\n` +
        `• 💶 <b>Rasmiy Ariza To'lovi:</b> <code>€${pricing.applicationFee} ${pricing.applicationFeeCurrency}</code>\n\n` +
        `📜 <b>Amaldagi Oferta:</b> <b>v${oferta.version}</b> (E'lon qilingan: ${oferta.publishedAt} — ${escapeHtml(oferta.publishedByName || "System")})\n` +
        (hasDraft ? `\n📝 <i>Eslatma: E'lon qilinmagan yangi qoralama (Draft v${draft.version}) mavjud.</i>\n` : "\n") +
        `<i>Quyidagi tugmalar orqali narxlarni o'zgartirishingiz, Ofertani tahrirlashingiz, ko'rib chiqishingiz va e'lon qilishingiz mumkin:</i>`
      : `📄 <b>OFERTA & PRICING MANAGEMENT (SUPER ADMIN HQ)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 <b>Current Configured Pricing (Single Source of Truth):</b>\n` +
        `• 📦 <b>NAWA Package:</b> <code>$${pricing.nawaPrice} ${pricing.nawaCurrency}</code>\n` +
        `• 💎 <b>Full Application + NAWA:</b> <code>$${pricing.fullApplicationNawaPrice} ${pricing.fullApplicationNawaCurrency}</code>\n` +
        `• 💶 <b>Administrative Application Fee:</b> <code>€${pricing.applicationFee} ${pricing.applicationFeeCurrency}</code>\n\n` +
        `📜 <b>Published Oferta:</b> <b>v${oferta.version}</b> (Published: ${oferta.publishedAt} — ${escapeHtml(oferta.publishedByName || "System")})\n` +
        (hasDraft ? `\n📝 <i>Note: There is an unpublished new draft (v${draft.version}) ready.</i>\n` : "\n") +
        `<i>Select an option below to modify pricing, edit Oferta text, preview, or publish:</i>`;

    await ctx.answerCallbackQuery();
    const kb = getAdminOfertaPricingKeyboard(pricing, oferta, Boolean(hasDraft), adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery("admin_edit_price_nawa", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);
    const pricing = db.getPricingConfig();
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_edit_price_nawa");
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `💵 <b>NAWA Paketining Yangi Narxini Kiriting</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Amaldagi narx: <b>$${pricing.nawaPrice} USD</b>\n\n` +
        `Yangi narxni faqat raqam shaklida yuboring (masalan: <code>15</code> yoki <code>20</code>):`
      : `💵 <b>Enter New Price for NAWA Package</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Current Price: <b>$${pricing.nawaPrice} USD</b>\n\n` +
        `Reply with the new price (e.g. <code>15</code> or <code>20</code>):`;

    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: isUz ? "◀️ Bekor Qilish" : "◀️ Cancel", callback_data: "admin_menu_oferta_pricing" }]],
      },
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery("admin_edit_price_full", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);
    const pricing = db.getPricingConfig();
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_edit_price_full");
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `💎 <b>Full Application + NAWA Yangi Narxini Kiriting</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Amaldagi narx: <b>$${pricing.fullApplicationNawaPrice} USD</b>\n\n` +
        `Yangi narxni faqat raqam shaklida yuboring (masalan: <code>50</code> yoki <code>60</code>):`
      : `💎 <b>Enter New Price for Full Application + NAWA</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Current Price: <b>$${pricing.fullApplicationNawaPrice} USD</b>\n\n` +
        `Reply with the new price (e.g. <code>50</code> or <code>60</code>):`;

    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: isUz ? "◀️ Bekor Qilish" : "◀️ Cancel", callback_data: "admin_menu_oferta_pricing" }]],
      },
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery("admin_edit_fee", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);
    const pricing = db.getPricingConfig();
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_edit_fee");
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `💶 <b>Rasmiy Ariza To'lovining (Application Fee) Yangi Miqdorini Kiriting</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Amaldagi to'lov: <b>€${pricing.applicationFee} EUR</b>\n\n` +
        `Yangi miqdorni raqam shaklida yuboring (masalan: <code>30</code>):`
      : `💶 <b>Enter New Application Fee</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Current Fee: <b>€${pricing.applicationFee} EUR</b>\n\n` +
        `Reply with the new application fee (e.g. <code>30</code>):`;

    const msg = await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: isUz ? "◀️ Bekor Qilish" : "◀️ Cancel", callback_data: "admin_menu_oferta_pricing" }]],
      },
    });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery("admin_edit_oferta_text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);
    const draft = db.getDraftOferta();
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_edit_oferta_text");
    await ctx.answerCallbackQuery();

    const info = isUz
      ? `✏️ <b>OFERTA MATNINI TAHRIRLASH (DRAFT v${draft.version})</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Yangi Oferta matnini yozib yuboring. Siz dinamik o'zgaruvchilardan foydalanishingiz mumkin:\n\n` +
        `• <code>{{NAWA_PRICE}}</code> — NAWA paketi narxini avtomatik qo'yadi\n` +
        `• <code>{{FULL_APPLICATION_NAWA_PRICE}}</code> — Full Application + NAWA narxini qo'yadi\n` +
        `• <code>{{APPLICATION_FEE}}</code> — Ariza to'lovini qo'yadi\n` +
        `• <code>{{LAST_UPDATED_DATE}}</code> — Oxirgi yangilanish sanasini qo'yadi\n\n` +
        `<i>Hozirgi matn nusxasi:</i>`
      : `✏️ <b>EDIT OFERTA TEXT (DRAFT v${draft.version})</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Send the full new Oferta text. You can use dynamic placeholders:\n\n` +
        `• <code>{{NAWA_PRICE}}</code> — Automatically inserts NAWA price\n` +
        `• <code>{{FULL_APPLICATION_NAWA_PRICE}}</code> — Inserts Full Application + NAWA price\n` +
        `• <code>{{APPLICATION_FEE}}</code> — Inserts Application Fee\n` +
        `• <code>{{LAST_UPDATED_DATE}}</code> — Inserts last updated date\n\n` +
        `<i>Current draft copy below:</i>`;

    await ctx.reply(info, { parse_mode: "HTML" });
    await ctx.reply(`<code>${escapeHtml(draft.text.slice(0, 3900))}</code>`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: isUz ? "◀️ Bekor Qilish" : "◀️ Cancel", callback_data: "admin_menu_oferta_pricing" }]],
      },
    });
  });

  bot.callbackQuery("admin_preview_oferta", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);
    const draft = db.getDraftOferta();
    const published = db.getPublishedOferta();
    const hasDraft = draft && draft.status === "draft" && draft.text !== published.text;
    const isUz = adminUser.lang === "uz";

    const textToRender = hasDraft ? draft.text : published.text;
    const rendered = db.getRenderedOferta(textToRender);

    await ctx.answerCallbackQuery();
    await ctx.reply(
      `👁️ <b>${isUz ? "OFERTA PREVIEW (FOYDALANUVCHI KO'RINISHI)" : "OFERTA TELEGRAM PREVIEW"}</b>\n` +
        `<i>(Versiya: v${hasDraft ? draft.version + " [Draft]" : published.version + " [Published]"})</i>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        rendered,
      {
        parse_mode: "HTML",
        reply_markup: getAdminOfertaPreviewKeyboard(Boolean(hasDraft), adminUser.lang),
      }
    );
  });

  bot.callbackQuery("admin_publish_oferta_confirm", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);
    const draft = db.getDraftOferta();
    const isUz = adminUser.lang === "uz";

    await ctx.answerCallbackQuery();
    await ctx.reply(
      `🚀 <b>Ofertani E'lon Qilishni Tasdiqlaysizmi?</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Yangi versiya: <b>v${draft.version}</b>\n` +
        `Bu versiya barcha foydalanuvchilar uchun rasmiy kuchga kiradi va amaldagi narxlar biriktiriladi.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: isUz ? "🚀 HA, E'LON QILISH (PUBLISH)" : "🚀 YES, PUBLISH NOW", callback_data: "admin_publish_oferta_execute" }],
            [{ text: isUz ? "◀️ Bekor Qilish" : "◀️ Cancel", callback_data: "admin_menu_oferta_pricing" }],
          ],
        },
      }
    );
  });

  bot.callbackQuery("admin_publish_oferta_execute", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAuthorizedSuperAdmin(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied. Super Admin only." });
      return;
    }
    const adminUser = db.getUser(userId);

    const published = db.publishOferta(
      userId,
      adminUser.fullName || adminUser.username || `Admin #${userId}`
    );

    await ctx.answerCallbackQuery({ text: `Oferta v${published.version} published!` });
    await ctx.reply(
      `✅ <b>OFERTA v${published.version} MUAFFAQIYATLI E'LON QILINDI!</b>\n\n` +
        `• Rasmiy nashr sanasi: <b>${published.publishedAt}</b>\n` +
        `• E'lon qilgan admin: <b>${escapeHtml(published.publishedByName || "Admin")}</b>\n` +
        `• Botdagi barcha foydalanuvchilar endi ushbu yangilangan Ofertani ko'radi.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "◀️ Oferta & Narxlar Paneliga", callback_data: "admin_menu_oferta_pricing" }]],
        },
      }
    );
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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "DELETE_UNIVERSITY",
      `Deleted university '${uniId}' from system catalog`,
      uniId
    );

    await ctx.answerCallbackQuery({ text: `University ${uniId} deleted!` });
    await ctx.reply(`🗑️ University <code>${escapeHtml(uniId)}</code> has been deleted.`, { parse_mode: "HTML" });

    const unis = db.getAllUniversities();
    const adminUserUpdated = db.getUser(adminId);
    await ctx.reply(`🏛️ <b>Polish Universities Database (${unis.length} institutions)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminUniversitiesKeyboard(unis, 0, 6, adminUserUpdated?.lang),
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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "TOGGLE_DOCDEF",
      `Toggled document '${docKey}' requirement status to: ${def.required ? "MANDATORY" : "OPTIONAL"}`,
      docKey
    );

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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "DELETE_DOCDEF",
      `Deleted document requirement '${docKey}' from system checklist`,
      docKey
    );

    await ctx.answerCallbackQuery({ text: `Document type ${docKey} deleted!` });
    await ctx.reply(`🗑️ Document type <code>${escapeHtml(docKey)}</code> deleted.`, { parse_mode: "HTML" });

    const docDefs = db.getDocumentDefinitions();
    const adminUserUpdated = db.getUser(adminId);
    await ctx.reply(`📑 <b>Document Checklist Requirements (${Object.keys(docDefs).length} types)</b>`, {
      parse_mode: "HTML",
      reply_markup: getAdminDocDefsKeyboard(docDefs, adminUserUpdated?.lang),
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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "MODERATE_REVIEW",
      `Student Review #${revId} was ${isApprove ? "APPROVED & PUBLISHED" : "REJECTED & REMOVED"}`,
      `Review #${revId}`
    );

    await ctx.answerCallbackQuery({ text: isApprove ? "Review Published!" : "Review Rejected & Deleted" });

    const rev = db.getReview(revId);

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

    const adminId = ctx.from?.id || 0;
    const adminUser = db.getUser(adminId);
    db.logAdminAction(
      adminId,
      adminUser.fullName || adminUser.username || `Admin #${adminId}`,
      "EDIT_REVIEW_RATING",
      `Changed rating of Review #${revId} to ${rev.rating}⭐`,
      `Review #${revId}`
    );

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

  // ================= 7.5 TEST MATERIALS MANAGEMENT =================
  bot.callbackQuery("admin_menu_tests", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const tests = db.getAllTests();
    await ctx.answerCallbackQuery();

    const text = isUz
      ? `📝 <b>Polsha Kirish Testlari & Qo'llanmalar Boshqaruvi (${tests.length} ta mavjud)</b>\n\n` +
        `<i>Yangi test qo'shish, fanni/nomini tahrirlash, havola/fayl yuklash yoki o'chirish uchun tanlang:</i>`
      : `📝 <b>Test Materials & Exam Papers Management (${tests.length} available)</b>\n\n` +
        `<i>Add new test files, edit title/subject, change download link, or delete materials:</i>`;

    const kb = getAdminTestsListKeyboard(tests, adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_view_test_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_view_test_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const test = db.getTest(testId);
    if (!test) {
      await ctx.answerCallbackQuery({ text: isUz ? "Test topilmadi" : "Test not found" });
      return;
    }

    await ctx.answerCallbackQuery();
    const title = test.title[adminUser.lang] || test.title.en;
    const desc = test.description
      ? test.description[adminUser.lang] || test.description.en
      : isUz ? "Tavsif mavjud emas." : "No description.";

    const text = isUz
      ? `📝 <b>Test Tafsilotlari:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ <b>Nomi:</b> ${escapeHtml(title)}\n` +
        `📚 <b>Fani:</b> ${escapeHtml(test.subject)}\n` +
        `💎 <b>Turi:</b> ${test.isFree ? "🟢 Bepul Namunaviy Variant" : "🔒 VIP Imtihon To'plami"}\n` +
        (test.fileName ? `📁 <b>Fayl:</b> <code>${escapeHtml(test.fileName)}</code>\n` : "") +
        (test.fileUrl ? `🔗 <b>Havola:</b> ${escapeHtml(test.fileUrl)}\n` : "") +
        (test.fileId ? `🆔 <b>Telegram File ID:</b> <code>${escapeHtml(test.fileId.slice(0, 20))}...</code>\n` : "") +
        `📅 <b>Yaratilgan:</b> ${test.createdAt}\n` +
        `👤 <b>Kirituvchi:</b> ${test.addedByName || "Admissions Team"}\n\n` +
        `📖 <b>Tavsif:</b>\n${escapeHtml(desc)}`
      : `📝 <b>Test Material Details:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ <b>Title:</b> ${escapeHtml(title)}\n` +
        `📚 <b>Subject:</b> ${escapeHtml(test.subject)}\n` +
        `💎 <b>Tier:</b> ${test.isFree ? "🟢 Free Sample" : "🔒 VIP Entrance Pack"}\n` +
        (test.fileName ? `📁 <b>File:</b> <code>${escapeHtml(test.fileName)}</code>\n` : "") +
        (test.fileUrl ? `🔗 <b>Link:</b> ${escapeHtml(test.fileUrl)}\n` : "") +
        (test.fileId ? `🆔 <b>Telegram File ID:</b> <code>${escapeHtml(test.fileId.slice(0, 20))}...</code>\n` : "") +
        `📅 <b>Created:</b> ${test.createdAt}\n` +
        `👤 <b>Added By:</b> ${test.addedByName || "Admissions Team"}\n\n` +
        `📖 <b>Description:</b>\n${escapeHtml(desc)}`;

    const kb = getAdminTestDetailKeyboard(test, adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery("admin_add_test", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_add_test_title");
    await ctx.answerCallbackQuery();

    const msg = await ctx.reply(
      isUz
        ? `➕ <b>Yangi Test Materiali Qo'shish (1/3-bosqich)</b>\n\n` +
          `Iltimos, test materialining nomini kiriting (masalan: <i>Varshava Universiteti Matematika Kirish Testi 2025</i>):`
        : `➕ <b>Add New Test Material (Step 1/3)</b>\n\n` +
          `Please enter the test material title (e.g. <i>Warsaw University Mathematics Entrance Exam 2025</i>):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_test_title_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_test_title_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_edit_test_title");
    db.updateUser(userId, { waitingPayload: { testId } });
    await ctx.answerCallbackQuery();

    const msg = await ctx.reply(
      isUz
        ? `✏️ <b>Test Nomini O'zgartirish</b>\n\n` +
          `Ushbu test uchun yangi sarlavhani chatga yuboring:`
        : `✏️ <b>Edit Test Title</b>\n\n` +
          `Send the new title for this test in chat:`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_test_subject_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_test_subject_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_add_test_subject");
    db.updateUser(userId, { waitingPayload: { testId, isEdit: true } });
    await ctx.answerCallbackQuery();

    const msg = await ctx.reply(
      isUz
        ? `📚 <b>Test Fanini O'zgartirish</b>\n\n` +
          `Ushbu test fani yoki yo'nalishini kiriting (masalan: <i>Matematika</i>, <i>Ingliz tili B2</i>, <i>Polyak tili</i>):`
        : `📚 <b>Edit Test Subject</b>\n\n` +
          `Enter the subject/field for this test (e.g. <i>Mathematics</i>, <i>English B2</i>, <i>Polish Language</i>):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_edit_test_file_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_edit_test_file_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    db.setWaitingFor(userId, "admin_edit_test_file");
    db.updateUser(userId, { waitingPayload: { testId } });
    await ctx.answerCallbackQuery();

    const msg = await ctx.reply(
      isUz
        ? `🔗 <b>Fayl yoki Havolani Yangilash</b>\n\n` +
          `Iltimos, yangi PDF faylni Telegram orqali yuboring yoki yangi yuklab olish havolasini (URL) matn ko'rinishida yozing:`
        : `🔗 <b>Update File or Download Link</b>\n\n` +
          `Please upload a new PDF document or send a new download link (URL):`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery(/^admin_toggle_test_vip_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_toggle_test_vip_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const test = db.getTest(testId);
    if (!test) {
      await ctx.answerCallbackQuery({ text: isUz ? "Test topilmadi" : "Test not found" });
      return;
    }

    const updatedIsFree = !test.isFree;
    const updated = db.updateTest(
      testId,
      { isFree: updatedIsFree },
      userId,
      adminUser.fullName || adminUser.username || "Admin"
    );

    await ctx.answerCallbackQuery({
      text: updatedIsFree
        ? (isUz ? "🟢 Test bepul holatga o'tkazildi" : "🟢 Test made free")
        : (isUz ? "🔒 Test VIP holatga o'tkazildi" : "🔒 Test set to VIP"),
    });

    if (updated) {
      const title = updated.title[adminUser.lang] || updated.title.en;
      const desc = updated.description
        ? updated.description[adminUser.lang] || updated.description.en
        : isUz ? "Tavsif mavjud emas." : "No description.";

      const text = isUz
        ? `📝 <b>Test Tafsilotlari:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Nomi:</b> ${escapeHtml(title)}\n` +
          `📚 <b>Fani:</b> ${escapeHtml(updated.subject)}\n` +
          `💎 <b>Turi:</b> ${updated.isFree ? "🟢 Bepul Namunaviy Variant" : "🔒 VIP Imtihon To'plami"}\n` +
          (updated.fileName ? `📁 <b>Fayl:</b> <code>${escapeHtml(updated.fileName)}</code>\n` : "") +
          (updated.fileUrl ? `🔗 <b>Havola:</b> ${escapeHtml(updated.fileUrl)}\n` : "") +
          `📅 <b>Yaratilgan:</b> ${updated.createdAt}\n` +
          `👤 <b>Kirituvchi:</b> ${updated.addedByName || "Admissions Team"}\n\n` +
          `📖 <b>Tavsif:</b>\n${escapeHtml(desc)}`
        : `📝 <b>Test Material Details:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Title:</b> ${escapeHtml(title)}\n` +
          `📚 <b>Subject:</b> ${escapeHtml(updated.subject)}\n` +
          `💎 <b>Tier:</b> ${updated.isFree ? "🟢 Free Sample" : "🔒 VIP Entrance Pack"}\n` +
          (updated.fileName ? `📁 <b>File:</b> <code>${escapeHtml(updated.fileName)}</code>\n` : "") +
          (updated.fileUrl ? `🔗 <b>Link:</b> ${escapeHtml(updated.fileUrl)}\n` : "") +
          `📅 <b>Created:</b> ${updated.createdAt}\n` +
          `👤 <b>Added By:</b> ${updated.addedByName || "Admissions Team"}\n\n` +
          `📖 <b>Description:</b>\n${escapeHtml(desc)}`;

      const kb = getAdminTestDetailKeyboard(updated, adminUser.lang);
      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
          return;
        } catch {}
      }
    }
  });

  bot.callbackQuery(/^admin_del_test_confirm_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_del_test_confirm_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    await ctx.answerCallbackQuery();
    const text = isUz
      ? `🚨 <b>Ushbu test materialini o'chirishni tasdiqlaysizmi?</b>\n\n` +
        `ID: <code>${testId}</code>`
      : `🚨 <b>Are you sure you want to delete this test material?</b>\n\n` +
        `ID: <code>${testId}</code>`;

    const kb = getAdminDeleteTestConfirmKeyboard(testId, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_del_test_execute_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^admin_del_test_execute_(.+)$/);
    if (!match) return;
    const testId = match[1];
    const userId = ctx.from?.id;
    if (!userId || !checkAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const deleted = db.deleteTest(testId, userId, adminUser.fullName || adminUser.username || "Admin");
    await ctx.answerCallbackQuery({
      text: deleted
        ? (isUz ? "🗑️ Test muvaffaqiyatli o'chirildi" : "🗑️ Test deleted successfully")
        : (isUz ? "Xatolik yuz berdi" : "Error deleting test"),
    });

    const tests = db.getAllTests();
    const text = isUz
      ? `📝 <b>Polsha Kirish Testlari Boshqaruvi (${tests.length} ta)</b>\n\n` +
        `Test o'chirildi. Yangi test qo'shish yoki mavjudlarini tahrirlash uchun tanlang:`
      : `📝 <b>Test Materials Management (${tests.length} total)</b>\n\n` +
        `Test deleted. Manage remaining test materials below:`;

    const kb = getAdminTestsListKeyboard(tests, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
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

  // ================= 9. SUPER ADMIN HQ & AUDIT LOGS =================
  bot.callbackQuery("admin_super_hq", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "⛔ Access Denied: Super Admin Only" });
      return;
    }
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const allAdmins = db.getAllAdmins();
    const auditLogs = db.getAuditLogs(100);
    const allUsers = db.getAllUsers();

    const text = isUz
      ? `👑 <b>SUPER ADMIN BOSHQARMASI (MAXFIY)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔒 <b>Peak Access Level:</b> Super Administrator (Boss)\n` +
        `🆔 Sizning ID: <code>${userId}</code> (Tizim egasi)\n\n` +
        `📊 <b>Nazorat Ko'rsatkichlari:</b>\n` +
        `• 🛡️ Faol Oddiy Adminlar: <b>${allAdmins.filter(a => !a.isSuperAdmin).length}</b> ta\n` +
        `• 📜 Yozilgan Audit Loglar: <b>${auditLogs.length}</b> ta\n` +
        `• 👥 Jami Talabalar Bazasi: <b>${allUsers.length}</b> ta\n` +
        `• 🗄️ Cloud DB Sync: <b>Supabase PostgreSQL (Live)</b>\n\n` +
        `<i>Bu bo'lim faqat sizga ko'rinadi. Oddiy adminlar sizning mavjudligingizni bilmaydi.</i>`
      : `👑 <b>SUPER ADMIN HEADQUARTERS (MASTER)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔒 <b>Peak Access Level:</b> Super Administrator (Boss)\n` +
        `🆔 Your Telegram ID: <code>${userId}</code> (Master Owner)\n\n` +
        `📊 <b>System Master Overview:</b>\n` +
        `• 🛡️ Active Regular Admins: <b>${allAdmins.filter(a => !a.isSuperAdmin).length}</b>\n` +
        `• 📜 Recorded Audit Logs: <b>${auditLogs.length}</b>\n` +
        `• 👥 Total User Database: <b>${allUsers.length}</b>\n` +
        `• 🗄️ Cloud Storage: <b>Supabase PostgreSQL (Live)</b>\n\n` +
        `<i>This command center is 100% invisible to regular admins.</i>`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminDashboardKeyboard(
      {
        adminsCount: allAdmins.length,
        auditLogsCount: auditLogs.length,
        usersCount: allUsers.length,
      },
      adminUser.lang
    );

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_super_logs_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "⛔ Access Denied" });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_logs_(\d+)$/);
    const page = match ? parseInt(match[1], 10) : 0;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const allLogs = db.getAuditLogs(200);
    const pageSize = 5;
    const totalPages = Math.ceil(allLogs.length / pageSize) || 1;
    const start = page * pageSize;
    const pageLogs = allLogs.slice(start, start + pageSize);

    let logsText = "";
    if (pageLogs.length === 0) {
      logsText = isUz ? "<i>Hozircha audit loglari mavjud emas.</i>" : "<i>No audit logs recorded yet.</i>";
    } else {
      logsText = pageLogs
        .map(
          (l, i) =>
            `<b>${start + i + 1}. [${l.timestamp}]</b>\n` +
            `👤 <b>Admin:</b> ${escapeHtml(l.adminName)} (<code>${l.adminId}</code>)\n` +
            `⚡ <b>Harakat / Action:</b> <code>${escapeHtml(l.action)}</code>\n` +
            (l.target ? `🎯 <b>Nishon / Target:</b> <code>${escapeHtml(l.target)}</code>\n` : "") +
            `📝 <b>Tafsilot / Details:</b> ${escapeHtml(l.details)}`
        )
        .join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n");
    }

    const header = isUz
      ? `📜 <b>ADMIN AUDIT VA XAVFSIZLIK LOGLARI (Sahifa ${page + 1}/${totalPages})</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>Adminlar tomonidan qilingan barcha harakatlar:</i>\n\n`
      : `📜 <b>ADMIN AUDIT & SECURITY LOGS (Page ${page + 1}/${totalPages})</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>Full chronological timeline of all admin actions across the bot:</i>\n\n`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminLogsKeyboard(allLogs, page, pageSize, adminUser.lang);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(header + logsText, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(header + logsText, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery("admin_super_admins_list", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const allAdmins = db.getAllAdmins();
    const regularAdmins = allAdmins.filter((a) => !a.isSuperAdmin);

    const text = isUz
      ? `🛡️ <b>ADMINLAR BOSHQARUVI</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 👑 Super Admin: <code>${userId}</code> (Siz - Boss)\n` +
        `• 👤 Faol Oddiy Adminlar: <b>${regularAdmins.length}</b> ta\n\n` +
        `<i>Adminlikdan bo'shatish uchun pastdagi tugmani bosing yoki yangi admin qo'shing:</i>`
      : `🛡️ <b>ADMIN MANAGEMENT</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 👑 Super Admin: <code>${userId}</code> (You - Master Boss)\n` +
        `• 👤 Active Regular Admins: <b>${regularAdmins.length}</b>\n\n` +
        `<i>Tap an admin to revoke access, or appoint a new admin:</i>`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminAdminsKeyboard(allAdmins, userId, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery(/^admin_super_demote_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) return;
    const match = ctx.callbackQuery?.data?.match(/^admin_super_demote_(\d+)$/);
    if (!match) return;
    const targetAdminId = parseInt(match[1], 10);

    const success = revokeAdminRole(targetAdminId, userId);
    if (!success) {
      await ctx.answerCallbackQuery({ text: "Cannot demote this user" });
      return;
    }

    await ctx.answerCallbackQuery({ text: `Admin #${targetAdminId} privileges revoked and sessions terminated!` });
    const allAdmins = db.getAllAdmins(true);
    const kb = getSuperAdminAdminsKeyboard(allAdmins, userId, db.getUser(userId).lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  // Super Admin Delete Admin Record
  bot.callbackQuery(/^admin_super_delete_admin_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_delete_admin_(\d+)$/);
    if (!match) return;
    const targetAdminId = parseInt(match[1], 10);

    const res = db.deleteAdmin(targetAdminId, userId);
    if (!res.success) {
      await ctx.answerCallbackQuery({ text: res.error || "Cannot delete this admin." });
      return;
    }

    await ctx.answerCallbackQuery({ text: `Admin #${targetAdminId} permanently deleted!` });
    const allAdmins = db.getAllAdmins(true);
    const kb = getSuperAdminAdminsKeyboard(allAdmins, userId, db.getUser(userId).lang);
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  // Super Admin Delete User Record
  bot.callbackQuery(/^admin_delete_user_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied: Only Super Admin can delete users." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_delete_user_(\d+)$/);
    if (!match) return;
    const targetUserId = parseInt(match[1], 10);

    if (targetUserId === config.superAdminTelegramId) {
      await ctx.answerCallbackQuery({ text: "Root Super Admin cannot be deleted." });
      return;
    }

    const ok = db.deleteUser(targetUserId, userId);
    if (ok) {
      await ctx.answerCallbackQuery({ text: `User #${targetUserId} completely deleted!` });
      await ctx.reply(`🗑️ <b>User #${targetUserId} and all associated records have been deleted permanently.</b>`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "◀️ Talabalar Ro'yxatiga / Users List", callback_data: "admin_menu_users" }]],
        },
      });
    } else {
      await ctx.answerCallbackQuery({ text: "User not found or already deleted." });
    }
  });

  // Admin Logout Handler
  bot.callbackQuery("admin_logout", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    endAdminSession(userId);
    await ctx.answerCallbackQuery({ text: "Admin session ended" });
    await ctx.reply("🔒 <b>Administrator Session Ended.</b> You have logged out.", { parse_mode: "HTML" });
  });

  bot.callbackQuery("admin_super_appoint_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);

    db.setWaitingFor(userId, "admin_super_appoint_user" as any);
    await ctx.answerCallbackQuery();
    const msg = await ctx.reply(
      adminUser.lang === "uz"
        ? "➕ <b>Yangi Admin Tayinlash:</b>\nAdmin qilmoqchi bo'lgan foydalanuvchining <b>Telegram User ID</b> raqamini yoki <b>@username</b> ini yuboring:"
        : "➕ <b>Appoint New Admin:</b>\nPlease send the <b>Telegram User ID</b> or <b>@username</b> of the user:",
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery("admin_super_confirm_clear_logs", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) return;
    db.clearAuditLogs();
    db.logAdminAction(userId, "Super Admin", "CLEAR_LOGS", "Cleared all previous audit logs.", undefined, "super_admin");
    await ctx.answerCallbackQuery({ text: "All audit logs cleared!" });
    const allAdmins = db.getAllAdmins(true);
    const allUsers = db.getAllUsers();
    const kb = getSuperAdminDashboardKeyboard(
      {
        adminsCount: allAdmins.length,
        auditLogsCount: 1,
        usersCount: allUsers.length,
      },
      db.getUser(userId).lang
    );
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: kb });
    } catch {}
  });

  bot.callbackQuery("admin_super_db_status", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) return;
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const users = db.getAllUsers();
    const apps = db.getAllApplications();
    const nawa = db.getAllNawaApplications();
    const revs = db.getAllReviews();

    const text = isUz
      ? `🗄️ <b>SUPABASE CLOUD DATABASE HOLATI</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🌐 Provider: <b>Supabase Cloud (PostgreSQL)</b>\n` +
        `• 🔗 URL: <code>${config.supabaseUrl}</code>\n` +
        `• 🟢 Cloud Sync: <b>Faol (Real-time auto-sync)</b>\n\n` +
        `📊 <b>Saqlangan Yozuvlar:</b>\n` +
        `• 👥 Foydalanuvchilar: <b>${users.length}</b> ta\n` +
        `• 📋 Arizalar: <b>${apps.length}</b> ta\n` +
        `• 🏛️ NAWA Arizalari: <b>${nawa.length}</b> ta\n` +
        `• ⭐ Sharhlar: <b>${revs.length}</b> ta\n` +
        `• 📜 Audit Loglar: <b>${db.getAuditLogs().length}</b> ta\n\n` +
        `<i>Ma'lumotlar har qanday o'zgarishda darhol Supabase bulutiga zaxiralanadi.</i>`
      : `🗄️ <b>SUPABASE CLOUD DATABASE STATUS</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 🌐 Provider: <b>Supabase Cloud (PostgreSQL)</b>\n` +
        `• 🔗 URL: <code>${config.supabaseUrl}</code>\n` +
        `• 🟢 Cloud Sync: <b>Active (Real-time auto-sync)</b>\n\n` +
        `📊 <b>Stored Data Entities:</b>\n` +
        `• 👥 Users: <b>${users.length}</b>\n` +
        `• 📋 Applications: <b>${apps.length}</b>\n` +
        `• 🏛️ NAWA Applications: <b>${nawa.length}</b>\n` +
        `• ⭐ Reviews: <b>${revs.length}</b>\n` +
        `• 📜 Audit Logs: <b>${db.getAuditLogs().length}</b>\n\n` +
        `<i>All records are synchronized to Supabase Cloud on every write.</i>`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminDbStatusKeyboard(adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  bot.callbackQuery("admin_super_force_sync", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) return;
    await db.syncToCloud();
    await ctx.answerCallbackQuery({ text: "✅ Forced Supabase Cloud Sync completed!" });
  });

  // Super Admin Reset/Wipe Database to 0
  bot.callbackQuery("admin_super_reset_db_confirm", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";

    const text = isUz
      ? `⚠️ <b>DIQQAT: BARCHA MA'LUMOTLARNI 0 GA TOZALASH (WIPE)</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `Bu amal barcha talabalar, adminlar, arizalar, promokodlar, tranzaksiyalar va sharhlarni <b>BUTUNLAY O'CHIRADI</b>.\n\n` +
        `Universitetlar katalogi va hujjatlar ro'yxati saqlab qolinadi.\n\n` +
        `<i>Haqiqatan ham barcha test ma'lumotlarni o'chirib, botni toza 0-data holatiga keltirmoqchimisiz?</i>`
      : `⚠️ <b>WARNING: RESET ALL DATA TO ZERO (WIPE DATABASE)</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `This action will <b>PERMANENTLY DELETE</b> all users, secondary admins, applications, promo codes, financial transactions, and reviews.\n\n` +
        `University catalogs and document definitions will be preserved.\n\n` +
        `<i>Are you sure you want to wipe all test data and reset the bot to a clean 0-data state?</i>`;

    await ctx.answerCallbackQuery();
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: isUz ? "🔴 HA, BARCHASINI O'CHIRISH (RESET)" : "🔴 YES, WIPE ALL DATA TO ZERO", callback_data: "admin_super_reset_db_execute" }],
          [{ text: isUz ? "◀️ Bekor Qilish" : "◀️ Cancel", callback_data: "admin_super_hq" }],
        ],
      },
    });
  });

  bot.callbackQuery("admin_super_reset_db_execute", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }

    db.resetDatabaseToZero(userId);
    await ctx.answerCallbackQuery({ text: "Database wiped and reset to 0!" });

    await ctx.reply(
      `✅ <b>0-DATA REJIMI: Barcha test ma'lumotlari muvaffaqiyatli tozalandi!</b>\n\n` +
        `• Barcha talabalar, qo'shimcha adminlar va arizalar o'chirildi.\n` +
        `• Tranzaksiyalar, promokodlar va audit loglar tozalandi.\n` +
        `• Bot yangi va toza production holatida ishga tayyor.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "◀️ Super Admin HQ", callback_data: "admin_super_hq" }]],
        },
      }
    );
  });

  // ================= PRIVATE SUPER ADMIN FINANCIAL HQ HANDLERS =================
  bot.callbackQuery("admin_super_financial_hq", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const fin = db.getFinancialSummary();

    const text = isUz
      ? `💰 <b>MAXFIY MOLIYAVIY BOSHQARUV (SUPER ADMIN HQ)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 <b>Jami Tasdiqlangan Tushum:</b> <code>$${fin.totalVerifiedRevenue.toLocaleString()}</code>\n` +
        `💳 <b>Tasdiqlangan To'lovlar Soni:</b> <b>${fin.verifiedPaymentsCount} ta</b>\n\n` +
        `📦 <b>NAWA Savdolari:</b> <b>${fin.nawaCount} ta</b> (<code>$${fin.nawaRevenue.toLocaleString()}</code>)\n` +
        `💎 <b>Full Application + NAWA Savdolari:</b> <b>${fin.nawaFullCount} ta</b> (<code>$${fin.nawaFullRevenue.toLocaleString()}</code>)\n\n` +
        `🟡 <b>Kutilayotgan (Tasdiqlanmagan):</b> <b>${fin.unverifiedCount} ta</b>\n` +
        `🔴 <b>Qaytarilgan / Bekor qilingan:</b> <b>${fin.refundedCount + fin.cancelledCount} ta</b>\n\n` +
        `🔒 <i>Ushbu ma'lumotlar faqat Super Admin uchun maxfiy. Oddiy adminlar bu bo'lim mavjudligini ko'ra olmaydi.</i>`
      : `💰 <b>PRIVATE FINANCIAL HQ (SUPER ADMIN ONLY)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 <b>Total Verified Revenue:</b> <code>$${fin.totalVerifiedRevenue.toLocaleString()}</code>\n` +
        `💳 <b>Verified Payments Count:</b> <b>${fin.verifiedPaymentsCount}</b>\n\n` +
        `📦 <b>NAWA Purchases:</b> <b>${fin.nawaCount}</b> (<code>$${fin.nawaRevenue.toLocaleString()}</code>)\n` +
        `💎 <b>Full Application + NAWA Purchases:</b> <b>${fin.nawaFullCount}</b> (<code>$${fin.nawaFullRevenue.toLocaleString()}</code>)\n\n` +
        `🟡 <b>Unverified / Pending Queue:</b> <b>${fin.unverifiedCount}</b>\n` +
        `🔴 <b>Refunded / Cancelled:</b> <b>${fin.refundedCount + fin.cancelledCount}</b>\n\n` +
        `🔒 <i>This financial system operates strictly in private. Normal administrators have zero financial visibility or access.</i>`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminFinancialHQKeyboard(adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  // All Transactions list
  bot.callbackQuery(/^admin_super_txns_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_txns_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const txns = db.getAllTransactions();

    const text = isUz
      ? `📋 <b>Barcha Moliyaviy Tranzaksiyalar (${txns.length} ta)</b>\n\n` +
        `<i>Tranzaksiya tafsilotlarini ko'rish, tasdiqlash yoki to'lovni qaytarish uchun ustiga bosing:</i>`
      : `📋 <b>All Financial Transactions (${txns.length})</b>\n\n` +
        `<i>Tap any transaction to view full ledger details, verify payment, or issue refund:</i>`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminTransactionsKeyboard(txns, page, 5, false, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  // Unverified queue
  bot.callbackQuery(/^admin_super_txns_unverified_(\d+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_txns_unverified_(\d+)$/);
    if (!match) return;
    const page = parseInt(match[1], 10);
    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const unverifiedTxns = db.getAllTransactions().filter((t) => t.status === "UNVERIFIED");

    const text = isUz
      ? `🟡 <b>Kutilayotgan / Tasdiqlanmagan To'lovlar (${unverifiedTxns.length} ta)</b>\n\n` +
        `<i>Tasdiqlash uchun tegishli tranzaksiyani tanlang va "To'lovni Tasdiqlash" tugmasini bosing:</i>`
      : `🟡 <b>Unverified / Pending Transactions (${unverifiedTxns.length})</b>\n\n` +
        `<i>Select a transaction to review and click "Verify Payment" to confirm and activate premium:</i>`;

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminTransactionsKeyboard(unverifiedTxns, page, 5, true, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  // View specific transaction details
  bot.callbackQuery(/^admin_super_view_txn_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_view_txn_(.+)$/);
    if (!match) return;
    const txnId = match[1];
    const txn = db.getTransaction(txnId);
    if (!txn) {
      await ctx.answerCallbackQuery({ text: "Transaction not found." });
      return;
    }

    const adminUser = db.getUser(userId);
    const isUz = adminUser.lang === "uz";
    const statusIcon =
      txn.status === "PAID"
        ? "🟢 PAID (Tasdiqlangan)"
        : txn.status === "UNVERIFIED"
        ? "🟡 UNVERIFIED (Tasdiqlanmagan)"
        : txn.status === "REFUNDED"
        ? "🔴 REFUNDED (Qaytarilgan)"
        : "⚪ CANCELLED (Bekor qilingan)";

    const text = isUz
      ? `🧾 <b>Tranzaksiya Tafsilotlari: <code>${escapeHtml(txn.id)}</code></b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 📌 <b>Holati:</b> ${statusIcon}\n` +
        `• 👤 <b>Talaba:</b> ${escapeHtml(txn.userName || "Noma'lum")} (<code>${txn.userId}</code>)\n` +
        `• 📦 <b>Paket:</b> <b>${escapeHtml(txn.product)}</b>\n` +
        `• 💵 <b>Summa:</b> <b>$${txn.amount} ${txn.currency}</b>\n` +
        `• 💳 <b>Manba:</b> <code>${txn.source}</code>\n` +
        (txn.promoCode ? `• 🔑 <b>Promokod:</b> <code>${escapeHtml(txn.promoCode)}</code>\n` : "") +
        `• 📅 <b>Yaratilgan:</b> ${escapeHtml(txn.createdAt)}\n` +
        (txn.verifiedAt ? `• ✅ <b>Tasdiqlangan:</b> ${escapeHtml(txn.verifiedAt)}\n` : "") +
        (txn.verifiedByName ? `• 👤 <b>Tasdiqlagan:</b> <b>${escapeHtml(txn.verifiedByName)}</b>\n` : "") +
        (txn.notes ? `• 📝 <b>Izoh:</b> <i>${escapeHtml(txn.notes)}</i>\n` : "")
      : `🧾 <b>Transaction Record: <code>${escapeHtml(txn.id)}</code></b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 📌 <b>Status:</b> ${statusIcon}\n` +
        `• 👤 <b>Student:</b> ${escapeHtml(txn.userName || "Unknown")} (<code>${txn.userId}</code>)\n` +
        `• 📦 <b>Product:</b> <b>${escapeHtml(txn.product)}</b>\n` +
        `• 💵 <b>Amount:</b> <b>$${txn.amount} ${txn.currency}</b>\n` +
        `• 💳 <b>Source:</b> <code>${txn.source}</code>\n` +
        (txn.promoCode ? `• 🔑 <b>Promo Code:</b> <code>${escapeHtml(txn.promoCode)}</code>\n` : "") +
        `• 📅 <b>Created:</b> ${escapeHtml(txn.createdAt)}\n` +
        (txn.verifiedAt ? `• ✅ <b>Verified:</b> ${escapeHtml(txn.verifiedAt)}\n` : "") +
        (txn.verifiedByName ? `• 👤 <b>Verified By:</b> <b>${escapeHtml(txn.verifiedByName)}</b>\n` : "") +
        (txn.notes ? `• 📝 <b>Notes:</b> <i>${escapeHtml(txn.notes)}</i>\n` : "");

    await ctx.answerCallbackQuery();
    const kb = getSuperAdminTransactionDetailKeyboard(txn, adminUser.lang);
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
        return;
      } catch {}
    }
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });

  // Verify payment action
  bot.callbackQuery(/^admin_super_verify_txn_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_verify_txn_(.+)$/);
    if (!match) return;
    const txnId = match[1];

    const res = db.verifyPaymentTransaction(txnId, userId);
    if (res.success && res.transaction) {
      await ctx.answerCallbackQuery({ text: "Payment verified successfully!" });
      await ctx.reply(
        `✅ <b>Payment Verified & Recorded!</b>\n\n` +
          `• 🧾 Transaction <code>${escapeHtml(txnId)}</code> is now marked as <b>PAID</b>.\n` +
          `• 💎 <b>${res.transaction.product}</b> package has been unlocked for User #${res.transaction.userId}.\n` +
          `• 👤 Verified by Super Admin #${userId}.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "◀️ Financial HQ", callback_data: "admin_super_financial_hq" }]],
          },
        }
      );
    } else {
      await ctx.answerCallbackQuery({ text: res.error || "Failed to verify payment." });
    }
  });

  // Refund payment action
  bot.callbackQuery(/^admin_super_refund_txn_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_refund_txn_(.+)$/);
    if (!match) return;
    const txnId = match[1];

    const ok = db.refundPaymentTransaction(txnId, userId, "Super Admin issued refund");
    if (ok) {
      await ctx.answerCallbackQuery({ text: "Transaction refunded." });
      await ctx.reply(
        `↩️ <b>Transaction Refunded:</b> <code>${escapeHtml(txnId)}</code> marked as <b>REFUNDED</b>. User entitlement revoked.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "◀️ Financial HQ", callback_data: "admin_super_financial_hq" }]],
          },
        }
      );
    } else {
      await ctx.answerCallbackQuery({ text: "Failed to refund transaction." });
    }
  });

  // Cancel transaction action
  bot.callbackQuery(/^admin_super_cancel_txn_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_cancel_txn_(.+)$/);
    if (!match) return;
    const txnId = match[1];

    db.cancelTransaction(txnId, userId);
    await ctx.answerCallbackQuery({ text: "Transaction cancelled." });
    await ctx.reply(`❌ <b>Transaction Cancelled:</b> <code>${escapeHtml(txnId)}</code>.`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "◀️ Financial HQ", callback_data: "admin_super_financial_hq" }]],
      },
    });
  });

  // Prompt manual external payment creation
  bot.callbackQuery("admin_super_create_txn_prompt", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);

    db.setWaitingFor(userId, "admin_super_create_txn_user" as any);
    await ctx.answerCallbackQuery();

    const msg = await ctx.reply(
      adminUser.lang === "uz"
        ? `➕ <b>Tashqi To'lov / Tranzaksiyani Kiritish (Manual Entry)</b>\n\n` +
          `Format: <code>&lt;USER_ID yoki @username&gt; &lt;NAWA|NAWA_FULL&gt; [SUMMA] [PAID|UNVERIFIED]</code>\n\n` +
          `<i>Misollar:</i>\n` +
          `• <code>5059829001 NAWA_FULL 50 PAID</code> (Darhol faollashtirish)\n` +
          `• <code>123456789 NAWA 15 UNVERIFIED</code> (Kutilayotgan to'lov)`
        : `➕ <b>Record External Payment / Transaction (Manual Entry)</b>\n\n` +
          `Format: <code>&lt;USER_ID or @username&gt; &lt;NAWA|NAWA_FULL&gt; [AMOUNT] [PAID|UNVERIFIED]</code>\n\n` +
          `<i>Examples:</i>\n` +
          `• <code>5059829001 NAWA_FULL 50 PAID</code> (Instant verified grant)\n` +
          `• <code>123456789 NAWA 15 UNVERIFIED</code> (Pending external check)`,
      { parse_mode: "HTML" }
    );
    db.setLastPromptMsgId(userId, msg.message_id);
  });
  // Delete single transaction permanently
  bot.callbackQuery(/^admin_super_delete_txn_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const match = ctx.callbackQuery?.data?.match(/^admin_super_delete_txn_(.+)$/);
    if (!match) return;
    const txnId = match[1];

    const ok = db.deleteTransaction(txnId, userId);
    if (ok) {
      await ctx.answerCallbackQuery({ text: "Transaction deleted permanently." });
      await ctx.reply(
        `🗑️ <b>Transaction Deleted:</b> <code>${escapeHtml(txnId)}</code> has been permanently removed from records.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "◀️ Financial HQ", callback_data: "admin_super_financial_hq" }]],
          },
        }
      );
    } else {
      await ctx.answerCallbackQuery({ text: "Transaction not found or could not be deleted." });
    }
  });

  // Prompt purge all transactions confirmation
  bot.callbackQuery("admin_super_purge_txns_confirm", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);
    const count = db.getAllTransactions().length;

    await ctx.answerCallbackQuery();
    await ctx.reply(
      adminUser.lang === "uz"
        ? `⚠️ <b>DIQQAT! Barcha tranzaksiyalarni o'chirish</b>\n\n` +
          `Siz tizimdagi barcha <b>${count} ta</b> tranzaksiya yozuvlarini butunlay o'chirmoqchisiz.\n\n` +
          `Haqiqatan ham barcha tranzaksiyalarni tozalashni tasdiqlaysizmi?`
        : `⚠️ <b>WARNING! Purge All Transactions</b>\n\n` +
          `You are about to permanently delete all <b>${count}</b> transaction records.\n\n` +
          `Are you sure you want to proceed?`,
      {
        parse_mode: "HTML",
        reply_markup: getSuperAdminPurgeTransactionsConfirmKeyboard(adminUser.lang),
      }
    );
  });

  // Execute purge all transactions
  bot.callbackQuery("admin_super_purge_txns_execute", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);
    const count = db.clearAllTransactions(userId);

    await ctx.answerCallbackQuery({ text: "All transactions purged." });
    await ctx.reply(
      adminUser.lang === "uz"
        ? `✅ <b>Barcha tranzaksiyalar tozalandi:</b> ${count} ta yozuv butunlay o'chirildi.`
        : `✅ <b>All transactions purged:</b> ${count} records permanently deleted.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "◀️ Financial HQ", callback_data: "admin_super_financial_hq" }]],
        },
      }
    );
  });

  // Prompt clear all audit logs confirmation
  bot.callbackQuery("admin_super_clear_logs_confirm", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);
    const count = db.getAuditLogs(500).length;

    await ctx.answerCallbackQuery();
    await ctx.reply(
      adminUser.lang === "uz"
        ? `⚠️ <b>DIQQAT! Audit loglarni tozalash</b>\n\n` +
          `Siz tizimdagi barcha <b>${count} ta</b> audit log yozuvlarini tozalash arafasidasiz.\n\n` +
          `Tasdiqlaysizmi?`
        : `⚠️ <b>WARNING! Clear Audit Logs</b>\n\n` +
          `You are about to delete all <b>${count}</b> audit log entries.\n\n` +
          `Are you sure?`,
      {
        parse_mode: "HTML",
        reply_markup: getSuperAdminClearLogsConfirmKeyboard(adminUser.lang),
      }
    );
  });

  // Execute clear all audit logs
  bot.callbackQuery("admin_super_clear_logs_execute", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !checkSuperAdminAuth(userId)) {
      await ctx.answerCallbackQuery({ text: "Access Denied." });
      return;
    }
    const adminUser = db.getUser(userId);
    db.clearAuditLogs();

    await ctx.answerCallbackQuery({ text: "Audit logs cleared." });
    await ctx.reply(
      adminUser.lang === "uz"
        ? `✅ <b>Barcha audit loglar muvaffaqiyatli tozalandi.</b>`
        : `✅ <b>All audit logs successfully cleared.</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "◀️ Super Admin HQ", callback_data: "admin_super_hq" }]],
        },
      }
    );
  });
}

