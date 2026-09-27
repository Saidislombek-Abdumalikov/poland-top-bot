import { Bot, Context } from "grammy";
import { db } from "../services/db";
import {
  authenticatePasscode,
  startAdminSession,
  isAuthorizedAdmin,
} from "../services/auth";
import {
  getAdminDashboardKeyboard,
  getAdminUsersListKeyboard,
} from "../keyboards/adminKeyboards";
import {
  getMainMenuKeyboard,
  getOnboardingDegreeKeyboard,
  getPhoneRequestKeyboard,
  getOfertaKeyboard,
  getReviewRatingKeyboard,
} from "../keyboards/menuKeyboards";
import { DegreeLevel, UserSessionData } from "../types";
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

  // Handle document file uploads (PDF, DOCX, etc.)
  bot.on("message:document", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const document = ctx.message?.document;
    if (!userId || !document) return;

    await cleanUpInput(ctx, userId);
    const user = db.getUser(userId);

    // Admin adding test file
    if (user.waitingFor === "admin_add_test_file" && user.waitingPayload) {
      const payload = user.waitingPayload;
      const testId = `test-${Date.now()}`;
      db.saveTest({
        id: testId,
        title: { en: payload.title, uz: payload.title },
        subject: payload.subject,
        fileId: document.file_id,
        fileName: document.file_name || "test_material.pdf",
        fileType: "document",
        isFree: true,
        createdAt: new Date().toISOString().split("T")[0],
        addedByName: user.fullName || "Admin",
      });

      db.setWaitingFor(userId, null);
      await ctx.reply(`✅ <b>Yangi test materiali muvaffaqiyatli saqlandi!</b>\nFayl: ${document.file_name}`, {
        parse_mode: "HTML",
      });
      return;
    }

    // Admin updating test file
    if (user.waitingFor === "admin_edit_test_file" && user.waitingPayload?.testId) {
      const test = db.getTest(user.waitingPayload.testId);
      if (test) {
        test.fileId = document.file_id;
        test.fileName = document.file_name || test.fileName;
        test.fileType = "document";
        db.saveTest(test);
      }
      db.setWaitingFor(userId, null);
      await ctx.reply(`✅ <b>Test fayli muvaffaqiyatli yangilandi!</b>`, { parse_mode: "HTML" });
      return;
    }

    // Student document upload
    if (user.waitingFor === "document_upload" && user.waitingPayload?.docKey) {
      const docKey = user.waitingPayload.docKey;
      await db.saveUserDocument(userId, docKey, {
        fileId: document.file_id,
        fileName: document.file_name,
        fileType: "document",
      });

      db.setWaitingFor(userId, null);
      await ctx.reply(
        `✅ <b>Hujjatingiz qabul qilindi va tekshiruvga yuborildi!</b>\n\n` +
          `📁 <b>Fayl:</b> <code>${escapeHtml(document.file_name || "Hujjat")}</code>\n` +
          `Qabul komissiyasi tekshirgach, natijasi haqida xabarnoma olasiz.`,
        { parse_mode: "HTML" }
      );
    }
  });

  // Handle photo uploads
  bot.on("message:photo", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const photos = ctx.message?.photo;
    if (!userId || !photos || photos.length === 0) return;

    await cleanUpInput(ctx, userId);
    const user = db.getUser(userId);
    const photo = photos[photos.length - 1]; // Highest resolution

    if (user.waitingFor === "document_upload" && user.waitingPayload?.docKey) {
      const docKey = user.waitingPayload.docKey;
      await db.saveUserDocument(userId, docKey, {
        fileId: photo.file_id,
        fileName: `${docKey}_photo.jpg`,
        fileType: "photo",
      });

      db.setWaitingFor(userId, null);
      await ctx.reply(
        `✅ <b>Hujjatingiz rasmi qabul qilindi va tekshiruvga yuborildi!</b>\n` +
          `Qabul komissiyasi tekshirgach, natijasi haqida xabarnoma olasiz.`,
        { parse_mode: "HTML" }
      );
    }
  });

  // Handle text messages
  bot.on("message:text", async (ctx: Context) => {
    const userId = ctx.from?.id;
    const text = ctx.message?.text?.trim();
    if (!userId || !text) return;

    const user = db.getUser(userId);

    // 1. Admin Authentication
    if (user.waitingFor === "admin_auth") {
      await cleanUpInput(ctx, userId);

      if (authenticatePasscode(text)) {
        startAdminSession(userId);
        db.setWaitingFor(userId, null);

        const users = db.getAllUsers();
        const apps = db.getAllApplications();
        const pendingDocs = db.getPendingDocuments();
        const allRevs = db.getAllReviews();
        const allTests = db.getAllTests();

        const successText =
          `✅ <b>Administrator Authentication Successful!</b>\n\n` +
          `Welcome to the PTU Admin CRM Panel.`;

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

        await ctx.reply(successText, { parse_mode: "HTML", reply_markup: kb });
      } else {
        await ctx.reply(
          `❌ <b>Invalid Passcode.</b>\n\nPlease try again or send /start to return to student mode:`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    // 2. Student Registration Flow
    if (user.waitingFor === "registration_name") {
      await cleanUpInput(ctx, userId);

      if (text.length < 3 || !text.includes(" ")) {
        const errorText =
          user.lang === "uz"
            ? `⚠️ Iltimos, to'liq ism va familiyangizni kiriting (masalan: <code>Saidislom Karimov</code>):`
            : `⚠️ Please enter your full first name and last name (e.g. <code>John Doe</code>):`;
        const msg = await ctx.reply(errorText, { parse_mode: "HTML" });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      db.updateUser(userId, { fullName: text });
      db.setWaitingFor(userId, "registration_phone");

      const phonePrompt =
        user.lang === "uz"
          ? `👋 <b>Rahmat, ${escapeHtml(text)}!</b>\n\n` +
            `📞 <b>2-Qadam (3 tadan): Telefon Raqamingiz</b>\n` +
            `Pastdagi <b>[ 📱 Telefon raqamni yuborish ]</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring (masalan: <code>+998901234567</code>):`
          : `👋 <b>Thank you, ${escapeHtml(text)}!</b>\n\n` +
            `📞 <b>Step 2 of 3: Phone Number</b>\n` +
            `Tap the <b>[ 📱 Share Phone Number ]</b> button below or type your phone number (e.g. <code>+998901234567</code>):`;

      const msg = await ctx.reply(phonePrompt, {
        parse_mode: "HTML",
        reply_markup: getPhoneRequestKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    if (user.waitingFor === "registration_phone") {
      await cleanUpInput(ctx, userId);

      const cleanPhone = text.replace(/[^\d+]/g, "");
      if (cleanPhone.length < 9) {
        const errorText =
          user.lang === "uz"
            ? `⚠️ Telefon raqam noto'g'ri shaklda. Iltimos, to'liq xalqaro formatda yozing (masalan: <code>+998901234567</code>):`
            : `⚠️ Invalid phone number format. Please provide full format (e.g. <code>+998901234567</code>):`;
        const msg = await ctx.reply(errorText, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      if (db.isPhoneRegistered(cleanPhone, userId)) {
        const errorMsg =
          user.lang === "uz"
            ? `⚠️ <b>Ushbu telefon raqam allaqachon ro'yxatdan o'tgan!</b> Iltimos, o'z telefon raqamingizni yuboring:`
            : `⚠️ <b>This phone number is already registered!</b> Please enter your own phone number:`;
        const msg = await ctx.reply(errorMsg, {
          parse_mode: "HTML",
          reply_markup: getPhoneRequestKeyboard(user.lang),
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      db.updateUser(userId, { phone: cleanPhone });
      db.setWaitingFor(userId, "registration_level");

      const levelPrompt =
        user.lang === "uz"
          ? `✅ <b>Telefon raqamingiz saqlandi:</b> <code>${escapeHtml(cleanPhone)}</code>\n\n` +
            `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
            `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
          : `✅ <b>Phone number saved:</b> <code>${escapeHtml(cleanPhone)}</code>\n\n` +
            `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
            `Please choose the degree level you plan to study in Poland:`;

      const msg = await ctx.reply(levelPrompt, {
        parse_mode: "HTML",
        reply_markup: getOnboardingDegreeKeyboard(user.lang),
      });
      db.setLastPromptMsgId(userId, msg.message_id);
      return;
    }

    // 3. Admin Counselor Feedback on Application
    if (user.waitingFor === "admin_feedback_app" && user.waitingPayload?.appId) {
      await cleanUpInput(ctx, userId);
      const appId = user.waitingPayload.appId;
      const app = db.getApplication(appId);
      if (app) {
        db.updateApplicationStage(appId, app.stage, text);
        try {
          await bot.api.sendMessage(
            app.userId,
            `💬 <b>Qabul Koordinatori Xabari (Ariza #${escapeHtml(appId)}):</b>\n\n` +
              `<i>"${escapeHtml(text)}"</i>`,
            { parse_mode: "HTML" }
          );
        } catch {}
      }
      db.setWaitingFor(userId, null);
      await ctx.reply(`✅ <b>Xabar talabaga yuborildi va arizaga saqlandi.</b>`, { parse_mode: "HTML" });
      return;
    }

    // 4. Admin Document Feedback Note (Needs correction)
    if (user.waitingFor === "admin_feedback_doc" && user.waitingPayload?.studentId) {
      await cleanUpInput(ctx, userId);
      const { studentId, docKey } = user.waitingPayload;
      db.updateDocumentStatus(studentId, docKey, "needs_correction", text);

      try {
        await bot.api.sendMessage(
          studentId,
          `⚠️ <b>Hujjatingiz bo'yicha tuzatish talab etiladi:</b>\n` +
            `📑 <b>Hujjat:</b> ${escapeHtml(docKey)}\n` +
            `💬 <b>Maslahatchi izohi:</b> <i>"${escapeHtml(text)}"</i>\n\n` +
            `Iltimos, Hujjatlar bo'limiga kirib to'g'ri nusxasini qayta yuklang.`,
          { parse_mode: "HTML" }
        );
      } catch {}

      db.setWaitingFor(userId, null);
      await ctx.reply(`✅ <b>Tuzatish izohi talabaga yuborildi.</b>`, { parse_mode: "HTML" });
      return;
    }

    // 5. Admin Search User
    if (user.waitingFor === "admin_search_user") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      const q = text.toLowerCase();
      const matched = db.getAllUsers().filter((u) => {
        return (
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          String(u.userId) === q
        );
      });

      if (matched.length === 0) {
        await ctx.reply(`🔍 <b>"${escapeHtml(text)}"</b> bo'yicha talaba topilmadi.`, { parse_mode: "HTML" });
        return;
      }

      const kb = getAdminUsersListKeyboard(matched, 0, 6, user.lang);
      await ctx.reply(`🔍 <b>Qidiruv natijalari (${matched.length} ta):</b>`, {
        parse_mode: "HTML",
        reply_markup: kb,
      });
      return;
    }

    // 6. Admin Broadcast
    if (user.waitingFor === "admin_broadcast_text") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      const allUsers = db.getAllUsers();
      let sentCount = 0;

      for (const u of allUsers) {
        try {
          await bot.api.sendMessage(
            u.userId,
            `📢 <b>POLAND TOP UNIVERSITIES — RASMIY E'LON:</b>\n\n${escapeHtml(text)}`,
            { parse_mode: "HTML" }
          );
          sentCount++;
        } catch {}
      }

      await ctx.reply(
        `✅ <b>Global xabar ${sentCount} ta talabaga muvaffaqiyatli yetkazildi!</b>`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // 7. Student Document Link Submission
    if (user.waitingFor === "document_upload" && user.waitingPayload?.docKey) {
      await cleanUpInput(ctx, userId);
      const docKey = user.waitingPayload.docKey;

      if (text.startsWith("http://") || text.startsWith("https://")) {
        await db.saveUserDocument(userId, docKey, {
          link: text,
          fileType: "link",
          fileName: "Cloud Storage Link",
        });

        db.setWaitingFor(userId, null);
        await ctx.reply(
          `✅ <b>Hujjat havolasi qabul qilindi va tekshiruvga yuborildi!</b>\n` +
            `🔗 <code>${escapeHtml(text)}</code>`,
          { parse_mode: "HTML" }
        );
        return;
      }
    }

    // 8. Admin Oferta Edit Text
    if (user.waitingFor === "admin_edit_oferta_text") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);

      db.updateOferta(text, user.fullName || "Admin");
      await ctx.reply(`✅ <b>Ommaviy Oferta yangi matni muvaffaqiyatli saqlandi va chop etildi!</b>`, {
        parse_mode: "HTML",
      });
      return;
    }

    // 9. Admin Add Test Material Flow
    if (user.waitingFor === "admin_add_test_title") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, "admin_add_test_subject", { title: text });
      await ctx.reply(
        `📝 <b>(2/3) Test qaysi fan yoki yo'nalishga oid?</b>\n(Masalan: <i>Matematika</i>, <i>Ingliz tili (B2)</i>, <i>Polyak tili</i>):`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (user.waitingFor === "admin_add_test_subject" && user.waitingPayload?.title) {
      await cleanUpInput(ctx, userId);
      const title = user.waitingPayload.title;
      db.setWaitingFor(userId, "admin_add_test_file", { title, subject: text });
      await ctx.reply(
        `📎 <b>(3/3) Endi test faylini (PDF) Telegram orqali yuboring:</b>\n` +
          `Yoki yuklab olish havolasini (Google Drive / website link) matn sifatida yuboring:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (user.waitingFor === "admin_add_test_file" && user.waitingPayload) {
      await cleanUpInput(ctx, userId);
      if (text.startsWith("http://") || text.startsWith("https://")) {
        const payload = user.waitingPayload;
        db.saveTest({
          id: `test-${Date.now()}`,
          title: { en: payload.title, uz: payload.title },
          subject: payload.subject,
          fileUrl: text,
          fileType: "link",
          fileName: "Download Link",
          isFree: true,
          createdAt: new Date().toISOString().split("T")[0],
          addedByName: user.fullName || "Admin",
        });
        db.setWaitingFor(userId, null);
        await ctx.reply(`✅ <b>Yangi test materiali havola orqali muvaffaqiyatli saqlandi!</b>`, {
          parse_mode: "HTML",
        });
        return;
      }
    }

    // 10. Student Review Submission Flow
    if (user.waitingFor === "student_review_program") {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, "student_review_text", {
        university: user.waitingPayload?.university || "Polish University",
        program: text,
        rating: user.waitingPayload?.rating || 5,
      });

      const prompt =
        user.lang === "uz"
          ? `✍️ <b>Polshadagi taassurotlaringiz va maslahatlaringizni yozing:</b>\n\n(Sharhingiz admin tekshiruvidan so'ng botda ko'rinadi):`
          : `✍️ <b>Please write your review and advice for prospective students:</b>:`;

      await ctx.reply(prompt, { parse_mode: "HTML" });
      return;
    }

    if (user.waitingFor === "student_review_text" && user.waitingPayload) {
      await cleanUpInput(ctx, userId);
      const p = user.waitingPayload;

      db.addReview({
        userId,
        name: user.fullName || user.firstName || "Student",
        country: user.country || "Uzbekistan",
        university: p.university,
        program: p.program,
        rating: p.rating || 5,
        year: String(new Date().getFullYear()),
        text: { en: text, uz: text },
        status: "pending",
      });

      db.setWaitingFor(userId, null);
      const ack =
        user.lang === "uz"
          ? `🎉 <b>Rahmat! Sharhingiz qabul qilindi.</b>\nMaslahatchi tasdiqlaganidan so'ng botda barcha talabalarga ko'rinadi.`
          : `🎉 <b>Thank you! Your review has been submitted for approval.</b>`;

      await ctx.reply(ack, { parse_mode: "HTML" });
      return;
    }
  });

  // Handle Onboarding Degree Level Callback
  bot.callbackQuery(/^onboarding_level_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_level_(.+)$/);
    if (!match) return;
    const level = match[1] as DegreeLevel;
    const userId = ctx.from?.id;
    if (!userId) return;

    db.updateUser(userId, { preferredLevel: level });
    db.setWaitingFor(userId, "waiting_oferta_acceptance");

    const user = db.getUser(userId);
    const isUz = user.lang === "uz";
    const renderedOferta = db.getRenderedOferta();

    await ctx.answerCallbackQuery();

    const ofertaMessage = isUz
      ? `📋 <b>Sizning Ma'lumotlaringiz:</b>\n` +
        `• 👤 <b>Ism:</b> ${escapeHtml(user.fullName || "")}\n` +
        `• 📞 <b>Telefon:</b> ${escapeHtml(user.phone || "")}\n` +
        `• 🎓 <b>Ta'lim Bosqichi:</b> ${escapeHtml(level)}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${renderedOferta}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👇 <b>Botdan to'liq foydalanishni boshlash uchun Ofertani qabul qiling va "✅ Roziman" tugmasini bosing:</b>`
      : `📋 <b>Your Profile Summary:</b>\n` +
        `• 👤 <b>Name:</b> ${escapeHtml(user.fullName || "")}\n` +
        `• 📞 <b>Phone:</b> ${escapeHtml(user.phone || "")}\n` +
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
    } catch {
      await ctx.reply(ofertaMessage, {
        parse_mode: "HTML",
        reply_markup: getOfertaKeyboard(user.lang),
      });
    }
  });

  // Handle Review Rating Selection Callback
  bot.callbackQuery(/^rev_rate_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^rev_rate_(\d+)$/);
    if (!match) return;
    const rating = parseInt(match[1], 10);
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    await ctx.answerCallbackQuery();

    db.setWaitingFor(userId, "student_review_program", { rating });

    const prompt = isUz
      ? `🏛️ <b>Qaysi universitet va yo'nalishda o'qiysiz?</b>\n(Masalan: <i>Warsaw University, Computer Science</i>):`
      : `🏛️ <b>Which university and program do you attend?</b>\n(e.g. <i>Warsaw University, Computer Science</i>):`;

    await ctx.reply(prompt, { parse_mode: "HTML" });
  });

  bot.callbackQuery("review_write_start", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    await ctx.answerCallbackQuery();

    const prompt = isUz
      ? `⭐ <b>Polshadagi ta'limingizni qanday baholaysiz?</b>\nBaho tanlang:`
      : `⭐ <b>How do you rate your study experience in Poland?</b>\nChoose rating:`;

    await ctx.reply(prompt, {
      parse_mode: "HTML",
      reply_markup: getReviewRatingKeyboard(user.lang),
    });
  });
}
