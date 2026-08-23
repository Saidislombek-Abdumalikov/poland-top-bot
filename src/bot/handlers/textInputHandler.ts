import { Bot, Context } from "grammy";
import { db } from "../services/db";
import {
  authenticatePasscode,
  startAdminSession,
  grantAdminRole,
  isAuthorizedSuperAdmin,
  isAuthorizedAdmin,
} from "../services/auth";
import {
  getAdminDashboardKeyboard,
  getSuperAdminDashboardKeyboard,
  getAdminUsersListKeyboard,
} from "../keyboards/adminKeyboards";
import {
  getMainMenuKeyboard,
  getOnboardingDegreeKeyboard,
  getPhoneRequestKeyboard,
  getOfertaKeyboard,
} from "../keyboards/menuKeyboards";
import { DegreeLevel, PremiumTier, UserSessionData } from "../types";
import { escapeHtml } from "../utils/format";

export function setupTextInputHandler(bot: Bot) {
  // Helper to cleanup user message and previous bot prompt
  const cleanUpInput = async (ctx: Context, userId: number) => {
    try {
      await ctx.deleteMessage();
    } catch {}

    const user = db.getUser(userId);
    if (user.lastPromptMsgId && ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, user.lastPromptMsgId);
      } catch {}
    }
  };

  // Handle contact sharing via Telegram button
  bot.on("message:contact", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const contact = ctx.message?.contact;
    if (!userId || !contact) return;

    await cleanUpInput(ctx, userId);
    const user = db.getUser(userId);

    if (user.waitingFor === "registration_phone") {
      const phoneNumber = contact.phone_number.startsWith("+")
        ? contact.phone_number
        : `+${contact.phone_number}`;

      // Check if phone number is already registered by another user
      if (db.isPhoneRegistered(phoneNumber, userId)) {
        const errorMsg =
          user.lang === "uz"
            ? `⚠️ <b>Ushbu telefon raqam allaqachon ro'yxatdan o'tgan!</b>\n\n` +
              `Bitta telefon raqam faqat bitta Telegram akkauntga biriktiriladi. Iltimos, o'zingizning shaxsiy telefon raqamingizni yuboring:`
            : `⚠️ <b>This phone number is already registered!</b>\n\n` +
              `Each phone number can only be linked to one Telegram account. Please share or type your own phone number:`;

        const msg = await ctx.reply(errorMsg, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      db.updateUser(userId, { phone: phoneNumber });
      db.setWaitingFor(userId, "registration_level");

      const levelPrompt =
        user.lang === "uz"
          ? `✅ <b>Telefon raqamingiz qabul qilindi:</b> <code>${escapeHtml(phoneNumber)}</code>\n\n` +
            `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
            `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
          : `✅ <b>Phone number received:</b> <code>${escapeHtml(phoneNumber)}</code>\n\n` +
            `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
            `Please choose the degree level you plan to study in Poland:`;

      const msg = await ctx.reply(levelPrompt, {
        parse_mode: "HTML",
        reply_markup: getOnboardingDegreeKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
    }
  });

  // Handle file uploads (PDF, DOCX, etc.)
  bot.on("message:document", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const document = ctx.message?.document;
    if (!userId || !document) return;

    const user = db.getUser(userId);

    if (user.waitingFor === "document_upload") {
      const docKey = user.waitingPayload?.docKey;
      if (docKey) {
        db.submitDocument(userId, docKey, {
          fileId: document.file_id,
          fileName: document.file_name || "document.pdf",
          fileType: "document",
        });
        db.setWaitingFor(userId, null);

        const isUz = user.lang === "uz";
        const replyText = isUz
          ? `✅ <b>Hujjat Fayli Qabul Qilindi!</b>\n\n` +
            `📄 <b>Hujjat:</b> ${escapeHtml(docKey.toUpperCase())}\n` +
            `📎 <b>Fayl:</b> <code>${escapeHtml(document.file_name || "document.pdf")}</code>\n` +
            `🟡 <b>Holati:</b> Qabul Maslahatchilari Tekshiruvida\n\n` +
            `Hujjatlaringiz tasdiqlanishi bilan sizga bu yerda xabar beramiz!`
          : `✅ <b>Document File Received!</b>\n\n` +
            `📄 <b>Document:</b> ${escapeHtml(docKey.toUpperCase())}\n` +
            `📎 <b>File Name:</b> <code>${escapeHtml(document.file_name || "document.pdf")}</code>\n` +
            `🟡 <b>Status:</b> Under Review by Admissions Advisors\n\n` +
            `You will be notified here as soon as our counselors verify your file!`;

        await ctx.reply(replyText, { parse_mode: "HTML" });
      }
    }
  });

  // Handle photo uploads (PNG, JPG)
  bot.on("message:photo", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const photos = ctx.message?.photo;
    if (!userId || !photos || photos.length === 0) return;

    const user = db.getUser(userId);

    if (user.waitingFor === "document_upload") {
      const docKey = user.waitingPayload?.docKey;
      if (docKey) {
        const largestPhoto = photos[photos.length - 1];
        db.submitDocument(userId, docKey, {
          fileId: largestPhoto.file_id,
          fileName: "photo_scan.jpg",
          fileType: "photo",
        });
        db.setWaitingFor(userId, null);

        const isUz = user.lang === "uz";
        const replyText = isUz
          ? `✅ <b>Hujjat Fotosurati Qabul Qilindi!</b>\n\n` +
            `📄 <b>Hujjat:</b> ${escapeHtml(docKey.toUpperCase())}\n` +
            `🖼️ <b>Fayl:</b> Sifatli rasm skaneri\n` +
            `🟡 <b>Holati:</b> Qabul Maslahatchilari Tekshiruvida\n\n` +
            `Hujjatlaringiz tasdiqlanishi bilan sizga bu yerda xabar beramiz!`
          : `✅ <b>Document Photo Received!</b>\n\n` +
            `📄 <b>Document:</b> ${escapeHtml(docKey.toUpperCase())}\n` +
            `🖼️ <b>Image File:</b> High-Resolution Scan\n` +
            `🟡 <b>Status:</b> Under Review by Admissions Advisors\n\n` +
            `You will be notified here as soon as our counselors verify your file!`;

        await ctx.reply(replyText, { parse_mode: "HTML" });
      }
    }
  });

  // Degree Level Selection Callback (Step 3: Target Degree Level) -> Send Oferta Message with [ ✅ Roziman ]
  bot.callbackQuery(/^onboarding_level_(.+)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_level_(.+)$/);
    if (!match) return;
    const level = match[1] as DegreeLevel;
    const userId = ctx.from?.id;
    if (!userId) return;

    // Update degree preference and set waitingFor to waiting_oferta_acceptance
    const user = db.updateUser(userId, {
      preferredLevel: level,
      isRegistered: false, // Remains false until Oferta is accepted!
      waitingFor: "waiting_oferta_acceptance",
      waitingPayload: null,
    });

    await ctx.answerCallbackQuery();

    const fullName = user.fullName || user.firstName || "Student";
    const phone = user.phone || "(not set)";
    const isUz = user.lang === "uz";
    const renderedOferta = db.getRenderedOferta();

    const ofertaMessage = isUz
      ? `📋 <b>Sizning Ma'lumotlaringiz:</b>\n` +
        `• 👤 <b>Ism:</b> ${escapeHtml(fullName)}\n` +
        `• 📞 <b>Telefon:</b> ${escapeHtml(phone)}\n` +
        `• 🎓 <b>Ta'lim Bosqichi:</b> ${escapeHtml(level)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${renderedOferta}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👇 <b>Botdan to'liq foydalanishni boshlash uchun Ofertani qabul qiling va "✅ Roziman" tugmasini bosing:</b>`
      : `📋 <b>Your Profile Summary:</b>\n` +
        `• 👤 <b>Name:</b> ${escapeHtml(fullName)}\n` +
        `• 📞 <b>Phone:</b> ${escapeHtml(phone)}\n` +
        `• 🎓 <b>Target Degree:</b> ${escapeHtml(level)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${renderedOferta}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👇 <b>To unlock the bot and begin, please read the Terms above and tap "✅ I Agree":</b>`;

    try {
      await ctx.editMessageText(ofertaMessage, {
        parse_mode: "HTML",
        reply_markup: getOfertaKeyboard(user.lang),
      });
      if (ctx.callbackQuery?.message?.message_id) {
        db.setLastPromptMsgId(userId, ctx.callbackQuery.message.message_id);
      }
    } catch {
      const msg = await ctx.reply(ofertaMessage, {
        parse_mode: "HTML",
        reply_markup: getOfertaKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
    }
  });

  // Handle text messages
  bot.on("message:text", async (ctx: Context, next) => {
    const text = ctx.message?.text?.trim();
    const userId = ctx.from?.id;
    if (!userId || !text) return next();

    // Ignore commands or main menu reply buttons
    if (
      text.startsWith("/") ||
      text.includes("🎓") ||
      text.includes("📚") ||
      text.includes("🏛️") ||
      text.includes("📋") ||
      text.includes("✍️") ||
      text.includes("💎") ||
      text.includes("👤")
    ) {
      return next();
    }

    const user = db.getUser(userId);

    // ================= SECURE ADMIN AUTHENTICATION INPUT =================
    if (user.waitingFor === "admin_auth") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      const secret = text.trim();
      const authenticatedRole = authenticatePasscode(secret);

      if (authenticatedRole === "super_admin") {
        startAdminSession(userId, "super_admin");
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Super Admin",
          "SUPER_ADMIN_LOGIN",
          "Authenticated successfully into Super Admin Master session via prompt",
          undefined,
          "super_admin"
        );
        await ctx.reply(
          `👑 <b>Super Admin Authentication Successful!</b>\n\n` +
          `Welcome, Boss. Master Command HQ and complete audit logs are unlocked.`,
          { parse_mode: "HTML" }
        );
        const allAdmins = db.getAllAdmins(true);
        const auditLogs = db.getAuditLogs(100);
        const allUsers = db.getAllUsers();
        const kb = getSuperAdminDashboardKeyboard(
          {
            adminsCount: allAdmins.length,
            auditLogsCount: auditLogs.length,
            usersCount: allUsers.length,
          },
          user.lang
        );
        await ctx.reply(
          user.lang === "uz"
            ? `👑 <b>SUPER ADMIN BOSHQARMASI (MAXFIY)</b>\n━━━━━━━━━━━━━━━━━━━━\n🔒 <b>Peak Access Level:</b> Super Administrator (Boss)`
            : `👑 <b>SUPER ADMIN HEADQUARTERS (MASTER)</b>\n━━━━━━━━━━━━━━━━━━━━\n🔒 <b>Peak Access Level:</b> Super Administrator (Boss)`,
          { parse_mode: "HTML", reply_markup: kb }
        );
      } else if (authenticatedRole === "admin") {
        startAdminSession(userId, "admin");
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Admin",
          "ADMIN_LOGIN",
          "Authenticated successfully into Regular Admin session via prompt",
          undefined,
          "admin"
        );
        await ctx.reply(
          `✅ <b>Administrator Authentication Successful!</b>\n\n` +
          `Admin CRM panel unlocked.`,
          { parse_mode: "HTML" }
        );
        const kb = getAdminDashboardKeyboard(
          {
            usersCount: db.getAllUsers().length,
            appsCount: db.getAllApplications().length,
            pendingDocsCount: db.getPendingDocuments().length,
            nawaCount: db.getAllNawaApplications().length,
            reviewsCount: db.getAllReviews().length,
            adminsCount: db.getAllAdmins(false).length,
          },
          user.lang,
          false
        );
        await ctx.reply(
          user.lang === "uz"
            ? `🎛️ <b>PTU Administrator CRM Paneli</b>\n━━━━━━━━━━━━━━━━━━━━`
            : `🎛️ <b>PTU Admin CRM Dashboard</b>\n━━━━━━━━━━━━━━━━━━━━`,
          { parse_mode: "HTML", reply_markup: kb }
        );
      } else {
        db.logAdminAction(
          userId,
          ctx.from?.first_name || "Unknown",
          "FAILED_LOGIN_ATTEMPT",
          "Failed authentication attempt with invalid passcode",
          undefined,
          "admin",
          "failure"
        );
        await ctx.reply(
          `⛔ <b>Authentication Failed:</b> Invalid credentials.`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // ================= UPFRONT STUDENT ONBOARDING STEPS =================
    const isAdminWorkflow = Boolean(user.waitingFor?.startsWith("admin_"));
    const isAuthorized = user.isAdmin || user.isSuperAdmin || isAuthorizedAdmin(userId);

    if (
      !isAdminWorkflow &&
      (user.waitingFor === "registration_name" ||
        user.waitingFor === "registration_phone" ||
        user.waitingFor === "registration_level" ||
        user.waitingFor === "waiting_oferta_acceptance" ||
        (!user.isRegistered && !isAuthorized))
    ) {
      if (user.lastPromptMsgId && ctx.chat) {
        try {
          await ctx.api.deleteMessage(ctx.chat.id, user.lastPromptMsgId);
        } catch {}
      }

      // Step 1: Full Name -> Prompt Phone with native share button
      if (user.waitingFor === "registration_name") {
        const parts = text.split(" ");
        const firstName = parts[0] || text;
        const lastName = parts.slice(1).join(" ") || "";

        db.updateUser(userId, { fullName: text, firstName, lastName });
        db.setWaitingFor(userId, "registration_phone");

        const phonePrompt =
          user.lang === "uz"
            ? `👋 Tanishganimdan xursandman, <b>${escapeHtml(text)}</b>!\n\n` +
              `📞 <b>2-Qadam (3 tadan): Telefon Raqamingiz</b>\n` +
              `Pastdagi <b>[ 📱 Telefon raqamni yuborish ]</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring (masalan: <code>+998901234567</code>):`
            : `👋 Nice to meet you, <b>${escapeHtml(text)}</b>!\n\n` +
              `📞 <b>Step 2 of 3: Phone Number</b>\n` +
              `Tap the <b>[ 📱 Share Phone Number ]</b> button below or type your phone number (e.g. <code>+998901234567</code>):`;

        const msg = await ctx.reply(phonePrompt, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // Step 2: Phone -> Prompt Degree Level Directly
      if (user.waitingFor === "registration_phone") {
        const cleanPhone = text.replace(/[^0-9+]/g, "");
        const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;

        if (cleanPhone.replace("+", "").length < 7) {
          const invalidPrompt =
            user.lang === "uz"
              ? `⚠️ <b>Noto'g'ri telefon raqam formati!</b>\n\nIltimos, to'liq telefon raqamingizni kiriting (masalan: <code>+998901234567</code>) yoki pastdagi tugmani bosing:`
              : `⚠️ <b>Invalid phone number format!</b>\n\nPlease enter a valid phone number (e.g. <code>+998901234567</code>) or use the button below:`;
          const msg = await ctx.reply(invalidPrompt, {
            parse_mode: "HTML",
            reply_markup: getPhoneRequestKeyboard(user.lang),
          });
          db.setLastPromptMsgId(userId, msg.message_id);
          return;
        }

        // Check if phone number is already registered by another account
        if (db.isPhoneRegistered(formattedPhone, userId)) {
          const errorMsg =
            user.lang === "uz"
              ? `⚠️ <b>Ushbu telefon raqam allaqachon ro'yxatdan o'tgan!</b>\n\n` +
                `Bitta telefon raqam faqat bitta Telegram akkauntga biriktiriladi. Iltimos, o'zingizning shaxsiy telefon raqamingizni yuboring:`
              : `⚠️ <b>This phone number is already registered!</b>\n\n` +
                `Each phone number can only be linked to one Telegram account. Please share or type your own phone number:`;

          const msg = await ctx.reply(errorMsg, {
            parse_mode: "HTML",
            reply_markup: getPhoneRequestKeyboard(user.lang),
          });
          db.setLastPromptMsgId(userId, msg.message_id);
          return;
        }

        db.updateUser(userId, { phone: formattedPhone });
        db.setWaitingFor(userId, "registration_level");

        const levelPrompt =
          user.lang === "uz"
            ? `✅ <b>Telefon raqamingiz qabul qilindi:</b> <code>${escapeHtml(formattedPhone)}</code>\n\n` +
              `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
              `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
            : `✅ <b>Phone number received:</b> <code>${escapeHtml(formattedPhone)}</code>\n\n` +
              `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
              `Please choose the degree level you plan to study in Poland:`;

        const msg = await ctx.reply(levelPrompt, {
          parse_mode: "HTML",
          reply_markup: getOnboardingDegreeKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      if (user.waitingFor === "registration_level") {
        const msg = await ctx.reply(
          user.lang === "uz"
            ? "⚠️ <b>Iltimos, avval ro'yxatdan o'tishni yakunlash uchun ta'lim darajangizni tanlang:</b>"
            : "⚠️ <b>Please select your target degree level above to complete registration:</b>",
          {
            parse_mode: "HTML",
            reply_markup: getOnboardingDegreeKeyboard(user.lang),
          }
        );
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // Step 4: Waiting for Oferta Acceptance
      if (user.waitingFor === "waiting_oferta_acceptance" || (user.fullName && user.phone && user.preferredLevel)) {
        const renderedOferta = db.getRenderedOferta();
        const reminder = user.lang === "uz"
          ? `⚠️ <b>Iltimos, botdan foydalanishni boshlash uchun avval quyidagi Ommaviy Ofertani qabul qiling ("✅ Roziman" tugmasini bosing):</b>\n\n${renderedOferta}`
          : `⚠️ <b>Please accept the Oferta below by tapping "✅ I Agree" to unlock the bot:</b>\n\n${renderedOferta}`;

        const msg = await ctx.reply(reminder, {
          parse_mode: "HTML",
          reply_markup: getOfertaKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // Unregistered and sent random text -> Redirect to step 1
      db.setWaitingFor(userId, "registration_name");
      const msg = await ctx.reply(
        user.lang === "uz"
          ? "👋 <b>Assalomu alaykum! Botdan foydalanish uchun avval to'liq ism va familiyangizni kiriting:</b>"
          : "👋 <b>Welcome! Please enter your Full Name to complete registration:</b>",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        }
      );
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    // ================= ADMIN WORKFLOWS =================
    // 1. Admin Counselor Feedback Note on Application
    if (user.waitingFor === "admin_feedback_app") {
      await cleanUpInput(ctx, userId);
      const appId = user.waitingPayload?.appId;
      if (appId) {
        const app = db.updateApplicationStage(appId, "Action Needed", text);
        db.setWaitingFor(userId, null);

        db.logAdminAction(
          userId,
          user.fullName || user.username || `Admin #${userId}`,
          "APP_FEEDBACK",
          `Sent counselor feedback on Application #${appId}: "${text}"`,
          `App #${appId}`
        );

        if (app) {
          try {
            const student = db.getUser(app.userId);
            const isUz = student.lang === "uz";

            const studentMsg = isUz
              ? `💬 <b>Qabul Koordinatori Xabari (Ariza #${escapeHtml(app.id)}):</b>\n\n` +
                `"${escapeHtml(text)}"\n\n` +
                `🏛️ <b>Universitet:</b> ${escapeHtml(app.university)}\n` +
                `📘 <b>Yo'nalish:</b> ${escapeHtml(app.programName)}\n\n` +
                `Iltimos, ko'rsatilgan talablarni ko'rib chiqing va arizalar bo'limida yangilang.`
              : `💬 <b>Counselor Feedback on Application #${escapeHtml(app.id)}:</b>\n\n` +
                `"${escapeHtml(text)}"\n\n` +
                `🏛️ <b>University:</b> ${escapeHtml(app.university)}\n` +
                `📘 <b>Program:</b> ${escapeHtml(app.programName)}\n\n` +
                `Please review your documents and update your dossier.`;

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

          await ctx.reply(`✅ Feedback note saved and sent to student for Application <b>${escapeHtml(appId)}</b>!`, {
            parse_mode: "HTML",
          });
        }
        return;
      }
    }

    // 2. Admin Rejection Note on Document
    if (user.waitingFor === "admin_feedback_doc") {
      await cleanUpInput(ctx, userId);
      const { targetUserId, docKey } = user.waitingPayload || {};
      if (targetUserId && docKey) {
        db.verifyDocument(targetUserId, docKey, "needs_correction", text);
        db.setWaitingFor(userId, null);

        db.logAdminAction(
          userId,
          user.fullName || user.username || `Admin #${userId}`,
          "DOC_FEEDBACK",
          `Sent revision feedback for document '${docKey}' to Student #${targetUserId}: "${text}"`,
          `User #${targetUserId}`
        );

        try {
          const student = db.getUser(targetUserId);
          const isUz = student.lang === "uz";
          const docDef = db.getDocumentDefinition(docKey);
          const docName = docDef ? (docDef.name[student.lang] || docDef.name.en) : docKey;

          const studentMsg = isUz
            ? `🔴 <b>Hujjatga Tuzatish Talab Qilinadi: ${escapeHtml(docName)}</b>\n\n` +
              `💬 <b>Qabul maslahatchisi izohi:</b>\n"${escapeHtml(text)}"\n\n` +
              `Iltimos, <b>Hujjatlar Ro'yxati</b> bo'limida to'g'rilangan faylni yuklang.`
            : `🔴 <b>Document Correction Required: ${escapeHtml(docName)}</b>\n\n` +
              `💬 <b>Counselor Note:</b>\n"${escapeHtml(text)}"\n\n` +
              `Please upload a revised copy in the <b>Document Checklist</b> menu.`;

          await bot.api.sendMessage(
            targetUserId,
            studentMsg,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [{ text: isUz ? "📁 Hujjatlar Ro'yxati" : "📁 Document Checklist", callback_data: "menu_docs" }],
                ],
              },
            }
          );
        } catch {}

        await ctx.reply(`✅ Rejection note saved and sent to student for <b>${escapeHtml(docKey)}</b>!`, {
          parse_mode: "HTML",
        });
        return;
      }
    }

    // 3. Admin Promo Code Creation
    if (user.waitingFor === "admin_create_promo") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split(" ");
      const code = parts[0]?.toUpperCase().trim();
      const rawTier = (parts[1] || "").toUpperCase();
      const tier: PremiumTier = rawTier === "NAWA" ? "NAWA" : "NAWA_FULL";

      if (code) {
        const created = db.createPromoCode({
          code,
          tier,
          maxUses: 1,
          createdBy: userId,
          createdByName: user.fullName || user.username || `Admin #${userId}`,
        });

        const pricing = db.getPricingConfig();
        const tierName = created.tier === "NAWA" ? `NAWA ($${pricing.nawaPrice})` : `Full Application + NAWA ($${pricing.fullApplicationNawaPrice})`;

        await ctx.reply(
          `✅ <b>Promo Code Created!</b>\n\n` +
            `• 🔑 Code: <code>${escapeHtml(created.code)}</code>\n` +
            `• 💎 Package: <b>${tierName}</b>\n` +
            `• 👥 Max Uses: <b>1 (Single Student Exclusive)</b>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // 4. Admin Search User
    if (user.waitingFor === "admin_search_user") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const results = db.searchUsers(text);

      if (results.length === 0) {
        await ctx.reply(`🔍 No students found matching "${escapeHtml(text)}".`, { parse_mode: "HTML" });
      } else {
        await ctx.reply(`🔍 <b>Search Results for "${escapeHtml(text)}" (${results.length} found):</b>`, {
          parse_mode: "HTML",
          reply_markup: getAdminUsersListKeyboard(results, 0),
        });
      }
      return;
    }

    // 5. Admin Broadcast Announcement
    if (user.waitingFor === "admin_broadcast_text") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const allUsers = db.getAllUsers();
      let sentCount = 0;

      await ctx.reply(`🚀 Broadcasting announcement to <b>${allUsers.length}</b> students...`, { parse_mode: "HTML" });

      for (const u of allUsers) {
        try {
          await bot.api.sendMessage(
            u.userId,
            `📢 <b>PTU Official Announcement:</b>\n\n${escapeHtml(text)}\n\n🇵🇱 <i>Poland Top Universities Team</i>`,
            { parse_mode: "HTML" }
          );
          sentCount++;
        } catch {}
      }

      db.logAdminAction(
        userId,
        user.fullName || user.username || `Admin #${userId}`,
        "GLOBAL_BROADCAST",
        `Sent broadcast announcement to ${sentCount}/${allUsers.length} students. Message: "${text.slice(0, 100)}..."`
      );

      await ctx.reply(`✅ Broadcast complete! Delivered to <b>${sentCount}</b> / <b>${allUsers.length}</b> students.`, {
        parse_mode: "HTML",
      });
      return;
    }

    // 6. Admin Add University
    if (user.waitingFor === "admin_add_university") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 4) {
        const id = parts[0].toLowerCase().replace(/\s+/g, "_");
        const name = parts[1];
        const abbr = parts[2] || id.toUpperCase();
        const city = parts[3] || "Warsaw";
        const type = (parts[4] === "Private" ? "Private" : "Public") as "Public" | "Private";
        const ranking = parts[5] || "#Top 20";
        const tuition = parts[6] || "2,500 EUR/yr";
        const website = parts[7] || "https://studyinpoland.pl";

        const newUni = {
          id,
          name,
          abbr,
          city,
          type,
          founded: 1990,
          website,
          programsCount: 15,
          students: 12000,
          internationalStudents: 1500,
          ranking,
          logo: "",
          description: {
            en: `${name} is a leading institution in ${city}, Poland.`,
            uz: `${name} — Polshaning ${city} shahridagi yetakchi oliygohi.`,
          },
          faculties: ["Information Technology", "Business & Management", "Economics"],
          tuition: {
            eu: "Free / 0 EUR",
            nonEu: tuition,
            english: tuition,
          },
          requirements: ["Secondary School Diploma", "English B2 Certificate", "Passport Copy"],
          deadline: "August 15",
        };

        db.saveUniversity(newUni);

        db.logAdminAction(
          userId,
          user.fullName || user.username || `Admin #${userId}`,
          "ADD_UNIVERSITY",
          `Added university '${newUni.name}' (${newUni.abbr}) in ${newUni.city} with tuition ${newUni.tuition.english} and website ${newUni.website}`,
          newUni.id
        );

        await ctx.reply(
          `✅ <b>New University Added Successfully!</b>\n\n` +
            `• 🏛️ <b>Name:</b> ${escapeHtml(newUni.name)} (${escapeHtml(newUni.abbr)})\n` +
            `• 📍 <b>City:</b> ${escapeHtml(newUni.city)}\n` +
            `• 🌐 <b>Website:</b> <a href="${escapeHtml(newUni.website)}">${escapeHtml(newUni.website)}</a>\n` +
            `• 💰 <b>Tuition:</b> ${escapeHtml(newUni.tuition.english)}\n\n` +
            `<i>Students can now see and browse this university immediately!</i>`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `⚠️ <b>Invalid Format.</b> Please provide at least:\n<code>id | Name | Abbr | City</code>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // 7. Admin Edit University Website
    if (user.waitingFor === "admin_edit_uni_web") {
      await cleanUpInput(ctx, userId);
      const uniId = user.waitingPayload?.uniId;
      db.setWaitingFor(userId, null);
      if (uniId) {
        const uni = db.getUniversity(uniId);
        if (uni) {
          uni.website = text;
          db.saveUniversity(uni);

          db.logAdminAction(
            userId,
            user.fullName || user.username || `Admin #${userId}`,
            "EDIT_UNI_WEBSITE",
            `Changed website URL of ${uni.name} to: ${text}`,
            uni.id
          );

          await ctx.reply(
            `✅ <b>Website Link Updated for ${escapeHtml(uni.name)}!</b>\n\n` +
              `🌐 <b>New Link:</b> <a href="${escapeHtml(text)}">${escapeHtml(text)}</a>`,
            { parse_mode: "HTML" }
          );
        }
      }
      return;
    }

    // 8. Admin Edit University Tuition
    if (user.waitingFor === "admin_edit_uni_tui") {
      await cleanUpInput(ctx, userId);
      const uniId = user.waitingPayload?.uniId;
      db.setWaitingFor(userId, null);
      if (uniId) {
        const uni = db.getUniversity(uniId);
        if (uni) {
          uni.tuition.english = text;
          uni.tuition.nonEu = text;
          db.saveUniversity(uni);

          db.logAdminAction(
            userId,
            user.fullName || user.username || `Admin #${userId}`,
            "EDIT_UNI_TUITION",
            `Changed tuition fee of ${uni.name} to: ${text}`,
            uni.id
          );

          await ctx.reply(
            `✅ <b>Tuition Updated for ${escapeHtml(uni.name)}!</b>\n\n` +
              `💰 <b>New Fee:</b> <code>${escapeHtml(text)}</code>`,
            { parse_mode: "HTML" }
          );
        }
      }
      return;
    }

    // 9. Admin Add Document Definition
    if (user.waitingFor === "admin_add_docdef") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        const id = parts[0].toLowerCase().replace(/\s+/g, "_");
        const nameEn = parts[1];
        const nameUz = parts[2] || nameEn;
        const descEn = parts[3] || `Official ${nameEn} document for admission.`;
        const descUz = parts[4] || `Qabul uchun ${nameUz} hujjati.`;
        const required = (parts[5] || "yes").toLowerCase().includes("y");

        const newDef = {
          id,
          name: { en: nameEn, uz: nameUz },
          desc: { en: descEn, uz: descUz },
          required,
        };

        db.saveDocumentDefinition(newDef);

        db.logAdminAction(
          userId,
          user.fullName || user.username || `Admin #${userId}`,
          "ADD_DOCDEF",
          `Added document requirement '${newDef.id}' (${newDef.name.en} / ${newDef.name.uz}, required: ${newDef.required})`,
          newDef.id
        );

        await ctx.reply(
          `✅ <b>New Document Requirement Added!</b>\n\n` +
            `• 📄 <b>Key:</b> <code>${escapeHtml(newDef.id)}</code>\n` +
            `• 🇬🇧 <b>Name (EN):</b> ${escapeHtml(newDef.name.en)}\n` +
            `• 🇺🇿 <b>Name (UZ):</b> ${escapeHtml(newDef.name.uz)}\n` +
            `• ⭐ <b>Required:</b> ${newDef.required ? "YES" : "NO"}\n\n` +
            `<i>This document is now automatically visible in all students' Document Checklists!</i>`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `⚠️ <b>Invalid Format.</b> Please provide: <code>key | Name EN | Name UZ | Desc EN | Desc UZ | yes/no</code>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // 10. Admin Add Review
    if (user.waitingFor === "admin_add_review") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 5) {
        const name = parts[0];
        const country = parts[1] || "Uzbekistan";
        const university = parts[2] || "Warsaw University";
        const program = parts[3] || "International Studies";
        const rating = parseInt(parts[4] || "5", 10);
        const textEn = parts[5] || "";
        const textUz = parts[6] || textEn;

        const rev = db.addReview({
          name,
          country,
          university,
          program,
          rating,
          text: { en: textEn, uz: textUz },
          status: "approved",
        });

        db.logAdminAction(
          userId,
          user.fullName || user.username || `Admin #${userId}`,
          "ADD_REVIEW",
          `Published student review for '${rev.name}' (${rev.university}, ${rev.rating}⭐)`,
          `Review #${rev.id}`
        );

        await ctx.reply(
          `✅ <b>Review Published Live!</b>\n\n` +
            `• 👤 <b>Student:</b> ${escapeHtml(rev.name)} (${escapeHtml(rev.country)})\n` +
            `• 🏛️ <b>University:</b> ${escapeHtml(rev.university)} — ${escapeHtml(rev.program)}\n` +
            `• ⭐ <b>Rating:</b> ${"⭐".repeat(rev.rating)}\n` +
            `• 💬 <b>Text:</b> "${escapeHtml(rev.text.en)}"`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `⚠️ <b>Invalid Format.</b> Please provide: <code>Name | Country | University | Program | Rating(1-5) | Text EN | Text UZ</code>`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // 11. Admin Edit Review Text
    if (user.waitingFor === "admin_edit_review_text") {
      await cleanUpInput(ctx, userId);
      const revId = user.waitingPayload?.revId;
      db.setWaitingFor(userId, null);
      if (revId) {
        db.updateReview(revId, { text: { en: text, uz: text } });

        db.logAdminAction(
          userId,
          user.fullName || user.username || `Admin #${userId}`,
          "EDIT_REVIEW_TEXT",
          `Updated text for Review #${revId}: "${text.slice(0, 100)}..."`,
          `Review #${revId}`
        );

        await ctx.reply(`✅ <b>Review #${revId} text updated successfully!</b>`, { parse_mode: "HTML" });
      }
      return;
    }

    // ================= STUDENT WORKFLOWS =================
    // 7. Student Document Link Submission
    if (user.waitingFor === "document_upload") {
      await cleanUpInput(ctx, userId);
      const docKey = user.waitingPayload?.docKey;
      if (docKey) {
        db.submitDocument(userId, docKey, {
          link: text,
          fileType: "link",
        });
        db.setWaitingFor(userId, null);

        const isUz = user.lang === "uz";
        const replyText = isUz
          ? `✅ <b>Hujjat Havolasi Qabul Qilindi!</b>\n\n` +
            `📄 <b>Hujjat:</b> ${escapeHtml(docKey.toUpperCase())}\n` +
            `🔗 <b>Havola:</b> <code>${escapeHtml(text)}</code>\n` +
            `🟡 <b>Holati:</b> Qabul Maslahatchilari Tekshiruvida\n\n` +
            `Hujjatlaringiz tasdiqlanishi bilan sizga bu yerda xabar beramiz!`
          : `✅ <b>Document Link Submitted!</b>\n\n` +
            `📄 <b>Document:</b> ${escapeHtml(docKey.toUpperCase())}\n` +
            `🔗 <b>Link:</b> <code>${escapeHtml(text)}</code>\n` +
            `🟡 <b>Status:</b> Under Review by Admissions Team\n\n` +
            `You will be notified here as soon as an advisor verifies your document!`;

        await ctx.reply(replyText, { parse_mode: "HTML" });
        return;
      }
    }

    // 8. Student Review - Step 2: Program -> Step 3: Text Prompt
    if (user.waitingFor === "student_review_program") {
      await cleanUpInput(ctx, userId);
      const rating = user.waitingPayload?.rating || 5;
      db.setWaitingFor(userId, "student_review_text", { rating, program: text });

      const isUz = user.lang === "uz";
      const promptText = isUz
        ? `💬 <b>3-Qadam: Sharhingiz Matni</b>\n\n` +
          `Polshada o'qish, viza olish, yotoqxona yoki bot xizmatlari haqidagi fikr va maslahatlaringizni yozib yuboring:`
        : `💬 <b>Step 3: Review Description</b>\n\n` +
          `Please share your thoughts, tips, and feedback about studying in Poland or your application process:`;

      const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    // 9. Student Review - Step 3: Save Review
    if (user.waitingFor === "student_review_text") {
      await cleanUpInput(ctx, userId);
      const rating = user.waitingPayload?.rating || 5;
      const programRaw = user.waitingPayload?.program || "General Study";
      db.setWaitingFor(userId, null);

      const fullName = user.fullName || user.firstName || "Student";
      const parts = programRaw.split("-");
      const university = parts[0]?.trim() || "Poland University";
      const program = parts[1]?.trim() || programRaw;

      const rev = db.addReview({
        userId,
        name: fullName,
        country: user.country || "Uzbekistan",
        university,
        program,
        rating,
        text: { en: text, uz: text },
        status: "pending",
      });

      const isUz = user.lang === "uz";
      const replyMsg = isUz
        ? `🎉 <b>Sharhingiz Muvaffaqiyatli Yuborildi!</b>\n\n` +
          `• 👤 Ism: <b>${escapeHtml(rev.name)}</b>\n` +
          `• ⭐ Baho: <b>${"⭐".repeat(rev.rating)}</b>\n` +
          `• 🏛️ Universitet: <b>${escapeHtml(rev.university)}</b>\n` +
          `• 💬 Fikr: <i>"${escapeHtml(text)}"</i>\n\n` +
          `🟡 <i>Sharhingiz moderatorlar tomonidan ko'rib chiqilib, tez orada talabalar sharhlari ro'yxatida e'lon qilinadi. Katta rahmat!</i>`
        : `🎉 <b>Review Submitted Successfully!</b>\n\n` +
          `• 👤 Name: <b>${escapeHtml(rev.name)}</b>\n` +
          `• ⭐ Rating: <b>${"⭐".repeat(rev.rating)}</b>\n` +
          `• 🏛️ University: <b>${escapeHtml(rev.university)}</b>\n` +
          `• 💬 Feedback: <i>"${escapeHtml(text)}"</i>\n\n` +
          `🟡 <i>Your review is in moderation and will appear in the Student Reviews section shortly. Thank you!</i>`;

      await ctx.reply(replyMsg, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }]],
        },
      });
      return;
    }

    // 10. Real Single-Use Database Promo Code Redemption
    if (user.waitingFor === "premium_code") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      const codeMatch = text.match(/[A-Za-z0-9]{6,12}/);
      const codeToRedeem = codeMatch ? codeMatch[0] : text.trim();
      const res = db.redeemPromoCode(codeToRedeem, userId);
      const isUz = user.lang === "uz";
      const pricing = db.getPricingConfig();

      if (res.success && res.tier) {
        const isNawaFull = res.tier === "NAWA_FULL" || res.tier === "Full Premium";
        const tierName = isNawaFull
          ? `Full Application + NAWA ($${pricing.fullApplicationNawaPrice})`
          : `NAWA ($${pricing.nawaPrice})`;

        const successMsg = isUz
          ? `🎉 <b>TABRIKLAYMIZ!</b>\n\n` +
            `Siz kiritgan <code>${escapeHtml(codeToRedeem.toUpperCase())}</code> promokodi muvaffaqiyatli faollashtirildi!\n` +
            `🌟 <b>Ochilgan A'zolik Paketi:</b> <b>${escapeHtml(tierName)}</b>\n\n` +
            (isNawaFull
              ? `• 📁 Hujjatlar nazorati va qabul hujjatlarini to'liq tekshirish\n` +
                `• 🏛️ Universitetlarga to'g'ridan-to'g'ri ariza topshirish huquqi\n` +
                `• 📜 NAWA SYRENA arizasi va Polsha qasamyodli tarjimalari (Tłumacz Przysięgły)\n` +
                `• ✍️ Kirish imtihonlari va yo'nalish testlariga to'liq kirish\n` +
                `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 aloqa`
              : `• 🏛️ Standart NAWA SYRENA arizasi va nostrifikatsiya yo'riqnomasi\n` +
                `• 📋 Polsha oliygohlari qabul talablari va dasturlar bazasi\n` +
                `• ✍️ Boshlang'ich testlar va tayyorgarlik materiallari\n` +
                `💡 <i>Hujjatlarni tekshirtirish va to'liq ariza topshirish uchun Full Application + NAWA ga oshirishingiz mumkin.</i>`)
          : `🎉 <b>CONGRATULATIONS!</b>\n\n` +
            `Your promo code <code>${escapeHtml(codeToRedeem.toUpperCase())}</code> has been redeemed successfully!\n` +
            `🌟 <b>Unlocked Package:</b> <b>${escapeHtml(tierName)}</b>\n\n` +
            (isNawaFull
              ? `• 📁 Full Document Checklist & Certified Advisor Verification\n` +
                `• 🏛️ Direct University Application Filing & Dossier Processing\n` +
                `• 📜 NAWA SYRENA Legalization & Sworn Translations (Tłumacz Przysięgły)\n` +
                `• ✍️ Complete Entrance & Placement Exam Access\n` +
                `• 💬 1-on-1 Dedicated Admissions Consultant Support`
              : `• 🏛️ Standard NAWA SYRENA Application & Recognition Guide\n` +
                `• 📋 Polish University Admission Requirements Directory\n` +
                `• ✍️ Standard Exam Preparation Materials\n` +
                `💡 <i>You can upgrade to Full Application + NAWA anytime for complete document review and application processing.</i>`);

        await ctx.reply(successMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: isNawaFull
              ? [
                  [{ text: isUz ? "📁 Hujjatlarni Yuklash" : "📁 Document Checklist", callback_data: "menu_docs" }],
                  [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
                ]
              : [[{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }]],
          },
        });
      } else {
        const failMsg = isUz
          ? `❌ <b>Faollashtirish Amalga Oshmadi</b>\n\n` +
            `Sabab: ${escapeHtml(res.error || "Kod topilmadi")}.\n` +
            `Iltimos, kiritilgan kodni tekshiring yoki yangi kod olish uchun maslahatchi bilan bog'laning:`
          : `❌ <b>Activation Failed</b>\n\n` +
            `Reason: ${escapeHtml(res.error || "Code not recognized")}.\n` +
            `Please contact your consultant or tap below to obtain a code:`;

        await ctx.reply(failMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: isUz ? "🔑 Qayta Kiritish" : "🔑 Try Again", callback_data: "premium_enter_code" }],
              [{
                text: isUz ? "💬 Maslahatchidan Kod Olish" : "💬 Contact Advisor for Access Code",
                url: "https://t.me/poland_admissions_bot",
              }],
              [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
            ],
          },
        });
      }
      return;
    }

    // 10b. Direct Promo Code Detection in Plain Chat Text
    if (!user.waitingFor) {
      const codeMatch = text.match(/^[A-Za-z0-9]{6,12}$/);
      if (codeMatch) {
        const candidateCode = codeMatch[0].toUpperCase();
        const maybePromo = db.getPromoCode(candidateCode);
        if (maybePromo && maybePromo.isActive && !maybePromo.isExpired) {
          await cleanUpInput(ctx, userId);
          const res = db.redeemPromoCode(candidateCode, userId);
          if (res.success && res.tier) {
            const isUz = user.lang === "uz";
            const pricing = db.getPricingConfig();
            const isNawaFull = res.tier === "NAWA_FULL" || res.tier === "Full Premium";
            const tierName = isNawaFull
              ? `Full Application + NAWA ($${pricing.fullApplicationNawaPrice})`
              : `NAWA ($${pricing.nawaPrice})`;

            const successMsg = isUz
              ? `🎉 <b>TABRIKLAYMIZ!</b>\n\n` +
                `Siz kiritgan <code>${escapeHtml(candidateCode)}</code> promokodi muvaffaqiyatli faollashtirildi!\n` +
                `🌟 <b>Ochilgan A'zolik Paketi:</b> <b>${escapeHtml(tierName)}</b>\n\n` +
                (isNawaFull
                  ? `• 📁 Hujjatlar nazorati va qabul hujjatlarini to'liq tekshirish\n` +
                    `• 🏛️ Universitetlarga to'g'ridan-to'g'ri ariza topshirish huquqi\n` +
                    `• 📜 NAWA SYRENA arizasi va Polsha qasamyodli tarjimalari (Tłumacz Przysięgły)\n` +
                    `• ✍️ Kirish imtihonlari va yo'nalish testlariga to'liq kirish\n` +
                    `• 💬 Shaxsiy qabul koordinatori bilan 1-ga-1 aloqa`
                  : `• 🏛️ Standart NAWA SYRENA arizasi va nostrifikatsiya yo'riqnomasi\n` +
                    `• 📋 Polsha oliygohlari qabul talablari va dasturlar bazasi\n` +
                    `• ✍️ Boshlang'ich testlar va tayyorgarlik materiallari`)
              : `🎉 <b>CONGRATULATIONS!</b>\n\n` +
                `Your promo code <code>${escapeHtml(candidateCode)}</code> has been redeemed successfully!\n` +
                `🌟 <b>Unlocked Package:</b> <b>${escapeHtml(tierName)}</b>\n\n` +
                (isNawaFull
                  ? `• 📁 Full Document Checklist & Certified Advisor Verification\n` +
                    `• 🏛️ Direct University Application Filing & Dossier Processing\n` +
                    `• 📜 NAWA SYRENA Legalization & Sworn Translations (Tłumacz Przysięgły)\n` +
                    `• ✍️ Complete Entrance & Placement Exam Access\n` +
                    `• 💬 1-on-1 Dedicated Admissions Consultant Support`
                  : `• 🏛️ Standard NAWA SYRENA Application & Recognition Guide\n` +
                    `• 📋 Polish University Admission Requirements Directory\n` +
                    `• ✍️ Standard Exam Preparation Materials`);

            await ctx.reply(successMsg, {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: isNawaFull
                  ? [
                      [{ text: isUz ? "📁 Hujjatlarni Yuklash" : "📁 Document Checklist", callback_data: "menu_docs" }],
                      [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
                    ]
                  : [[{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }]],
              },
            });
            return;
          }
        }
      }
    }

    // 11. Super Admin Appoint User
    if (user.waitingFor === ("admin_super_appoint_user" as any)) {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      if (!user.isSuperAdmin) return;

      const q = text.replace("@", "").trim();
      let targetUser: UserSessionData | undefined;

      if (/^\d+$/.test(q)) {
        targetUser = db.getUser(parseInt(q, 10));
      } else {
        const found = db.searchUsers(q);
        targetUser = found[0];
      }

      if (targetUser) {
        grantAdminRole(targetUser.userId, userId, false);

        await ctx.reply(
          `✅ <b>Admin Successfully Appointed!</b>\n\n` +
            `• 👤 <b>User:</b> ${escapeHtml(targetUser.fullName || targetUser.username || "User")}\n` +
            `• 🆔 <b>Telegram ID:</b> <code>${targetUser.userId}</code>\n` +
            `• 🛡️ <b>Role:</b> Regular Administrator\n\n` +
            `<i>They can now use <code>/admin</code> to access the admin dashboard.</i>`,
          { parse_mode: "HTML" }
        );
      } else {
        await ctx.reply(
          `⚠️ <b>User Not Found.</b> Make sure they have interacted with the bot at least once or enter their exact numeric Telegram ID.`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // 12. Super Admin Record External Payment / Transaction
    if (user.waitingFor === ("admin_super_create_txn_user" as any)) {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      if (!user.isSuperAdmin) return;

      const parts = text.split(/\s+/);
      const targetUserIdStr = parts[0]?.replace("@", "").trim();
      const rawProduct = (parts[1] || "").toUpperCase();
      const product: "NAWA" | "NAWA_FULL" = rawProduct === "NAWA" ? "NAWA" : "NAWA_FULL";
      const defaultAmount = product === "NAWA" ? 15 : 50;
      const amount = parts[2] && !isNaN(parseFloat(parts[2])) ? parseFloat(parts[2]) : defaultAmount;
      const rawStatus = (parts[3] || "PAID").toUpperCase();
      const status: "UNVERIFIED" | "PAID" = rawStatus === "UNVERIFIED" ? "UNVERIFIED" : "PAID";

      let targetUser: UserSessionData | undefined;
      if (/^\d+$/.test(targetUserIdStr)) {
        targetUser = db.getUser(parseInt(targetUserIdStr, 10));
      } else {
        const found = db.searchUsers(targetUserIdStr);
        targetUser = found[0];
      }

      if (!targetUser) {
        await ctx.reply(
          `⚠️ <b>User Not Found.</b> Please provide a valid numeric User ID or registered @username.`,
          { parse_mode: "HTML" }
        );
        return;
      }

      const txn = db.createTransaction({
        userId: targetUser.userId,
        userName: targetUser.fullName || targetUser.username || `User #${targetUser.userId}`,
        product,
        amount,
        status,
        source: "EXTERNAL_TRANSFER",
        notes: `Recorded manually by Super Admin #${userId}`,
        actorId: userId,
      });

      if (status === "PAID") {
        db.verifyPaymentTransaction(txn.id, userId, "Direct verification upon manual entry");
      }

      await ctx.reply(
        `💰 <b>Transaction Successfully Recorded!</b>\n\n` +
          `• 🧾 <b>ID:</b> <code>${txn.id}</code>\n` +
          `• 👤 <b>Student:</b> ${escapeHtml(targetUser.fullName || targetUser.username || "User")} (<code>${targetUser.userId}</code>)\n` +
          `• 📦 <b>Product:</b> <b>${txn.product}</b> ($${txn.amount})\n` +
          `• 📌 <b>Status:</b> <b>${status}</b>\n` +
          `• 💳 <b>Source:</b> External Bank/Card Transfer\n\n` +
          (status === "PAID"
            ? `✨ <i>Premium ${txn.product} has been automatically activated for the student.</i>`
            : `🟡 <i>Payment is UNVERIFIED. You can verify it anytime in Financial HQ.</i>`),
        { parse_mode: "HTML" }
      );
      return;
    }

    // 17. Admin Edit NAWA Price (Super Admin Only)
    if (user.waitingFor === "admin_edit_price_nawa") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      if (!isAuthorizedSuperAdmin(userId)) {
        await ctx.reply(`⛔ <b>Access Denied:</b> Only Super Admin can modify pricing.`, { parse_mode: "HTML" });
        return;
      }

      const parsedPrice = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        await ctx.reply(
          `⚠️ <b>Xatolik / Invalid Price:</b> Narx musbat raqam bo'lishi kerak (masalan: <code>15</code> yoki <code>20</code>).`,
          { parse_mode: "HTML" }
        );
        return;
      }

      db.updatePricingConfig(
        { nawaPrice: parsedPrice },
        userId,
        user.fullName || user.username || `Admin #${userId}`
      );

      await ctx.reply(
        `✅ <b>NAWA narxi muvaffaqiyatli yangilandi!</b>\n\n` +
          `• Yangi narx: <b>$${parsedPrice} USD</b>\n` +
          `• Ushbu yangi narx barcha bo'limlar va Ofertada avtomatik aks etadi.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📄 Oferta & Narxlar Paneliga", callback_data: "admin_menu_oferta_pricing" }],
            ],
          },
        }
      );
      return;
    }

    // 18. Admin Edit Full Application + NAWA Price (Super Admin Only)
    if (user.waitingFor === "admin_edit_price_full") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      if (!isAuthorizedSuperAdmin(userId)) {
        await ctx.reply(`⛔ <b>Access Denied:</b> Only Super Admin can modify pricing.`, { parse_mode: "HTML" });
        return;
      }

      const parsedPrice = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        await ctx.reply(
          `⚠️ <b>Xatolik / Invalid Price:</b> Narx musbat raqam bo'lishi kerak (masalan: <code>50</code> yoki <code>60</code>).`,
          { parse_mode: "HTML" }
        );
        return;
      }

      db.updatePricingConfig(
        { fullApplicationNawaPrice: parsedPrice },
        userId,
        user.fullName || user.username || `Admin #${userId}`
      );

      await ctx.reply(
        `✅ <b>Full Application + NAWA narxi muvaffaqiyatli yangilandi!</b>\n\n` +
          `• Yangi narx: <b>$${parsedPrice} USD</b>\n` +
          `• Ushbu yangi narx barcha bo'limlar va Ofertada avtomatik aks etadi.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📄 Oferta & Narxlar Paneliga", callback_data: "admin_menu_oferta_pricing" }],
            ],
          },
        }
      );
      return;
    }

    // 19. Admin Edit Application Fee (Super Admin Only)
    if (user.waitingFor === "admin_edit_fee") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      if (!isAuthorizedSuperAdmin(userId)) {
        await ctx.reply(`⛔ <b>Access Denied:</b> Only Super Admin can modify application fee.`, { parse_mode: "HTML" });
        return;
      }

      const parsedFee = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(parsedFee) || parsedFee < 0) {
        await ctx.reply(
          `⚠️ <b>Xatolik / Invalid Fee:</b> Ariza to'lovi 0 yoki undan yuqori raqam bo'lishi kerak (masalan: <code>30</code>).`,
          { parse_mode: "HTML" }
        );
        return;
      }

      db.updatePricingConfig(
        { applicationFee: parsedFee },
        userId,
        user.fullName || user.username || `Admin #${userId}`
      );

      await ctx.reply(
        `✅ <b>Ariza to'lovi muvaffaqiyatli yangilandi!</b>\n\n` +
          `• Yangi to'lov miqdori: <b>€${parsedFee} EUR</b>\n` +
          `• Ushbu to'lov barcha Ofertada va tariflarda avtomatik aks etadi.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📄 Oferta & Narxlar Paneliga", callback_data: "admin_menu_oferta_pricing" }],
            ],
          },
        }
      );
      return;
    }

    // 20. Admin Edit Oferta Text (Draft - Super Admin Only)
    if (user.waitingFor === "admin_edit_oferta_text") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      if (!isAuthorizedSuperAdmin(userId)) {
        await ctx.reply(`⛔ <b>Access Denied:</b> Only Super Admin can edit Oferta text.`, { parse_mode: "HTML" });
        return;
      }

      if (!text || text.trim().length < 20) {
        await ctx.reply(
          `⚠️ <b>Xatolik / Too Short:</b> Oferta matni kamida 20 ta belgidan iborat bo'lishi kerak.`,
          { parse_mode: "HTML" }
        );
        return;
      }

      if (text.length > 4000) {
        await ctx.reply(
          `⚠️ <b>Xatolik / Message Too Long:</b> Telegram bitta xabar uchun matn uzunligi 4000 belgidan oshmasligi kerak (Sizda: ${text.length} belgi).`,
          { parse_mode: "HTML" }
        );
        return;
      }

      const draft = db.updateDraftOferta(
        text,
        userId,
        user.fullName || user.username || `Admin #${userId}`
      );

      await ctx.reply(
        `✅ <b>Yangi Oferta Qoralamasi (Draft v${draft.version}) Saqlandi!</b>\n\n` +
          `Siz ushbu qoralamani avval <b>Ko'rib chiqishingiz (Preview)</b> va barcha narxlar to'g'riligiga ishonch hosil qilgach <b>E'lon qilishingiz (Publish)</b> mumkin.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "👁️ Ofertani Ko'rish (Preview)", callback_data: "admin_preview_oferta" },
                { text: "🚀 E'lon Qilish (Publish)", callback_data: "admin_publish_oferta_confirm" },
              ],
              [{ text: "◀️ Oferta & Narxlar Paneli", callback_data: "admin_menu_oferta_pricing" }],
            ],
          },
        }
      );
      return;
    }

    return next();
  });
}
