import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { isSuperAdmin } from "../config";
import { getAdminUsersListKeyboard } from "../keyboards/adminKeyboards";
import { getMainMenuKeyboard, getOnboardingDegreeKeyboard } from "../keyboards/menuKeyboards";
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

      db.updateUser(userId, { phone: phoneNumber });
      db.setWaitingFor(userId, "registration_level");

      const levelPrompt =
        user.lang === "uz"
          ? `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
            `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
          : `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
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

  // Degree Level Selection Callback (Final Onboarding Step) -> Edit prompt to celebration!
  bot.callbackQuery(/^onboarding_level_(.+)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery?.data?.match(/^onboarding_level_(.+)$/);
    if (!match) return;
    const level = match[1] as DegreeLevel;
    const userId = ctx.from?.id;
    if (!userId) return;

    const user = db.updateUser(userId, {
      preferredLevel: level,
      isRegistered: true,
      waitingFor: null,
      waitingPayload: null,
    });

    await ctx.answerCallbackQuery();

    const fullName = user.fullName || user.firstName || "Student";
    const phone = user.phone || "<i>(not set)</i>";

    const congratsText =
      user.lang === "uz"
        ? `🎉 <b>Tabriklaymiz, ${escapeHtml(fullName)}! Profilingiz Muvaffaqiyatli Yaratildi!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• 👤 <b>Ism:</b> ${escapeHtml(fullName)}\n` +
          `• 📞 <b>Telefon:</b> ${escapeHtml(phone)}\n` +
          `• 🎓 <b>Dastur Darajasi:</b> ${escapeHtml(level)}\n` +
          `• 💎 <b>A'zolik:</b> ${escapeHtml(user.premiumTier || "Free")}\n\n` +
          `🚀 Endi siz Polsha universitetlarini ko'rishingiz, dasturlarni tanlashingiz va arizangizni boshlashingiz mumkin!`
        : `🎉 <b>Congratulations, ${escapeHtml(fullName)}! Your Student Profile is Ready!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `• 👤 <b>Name:</b> ${escapeHtml(fullName)}\n` +
          `• 📞 <b>Phone:</b> ${escapeHtml(phone)}\n` +
          `• 🎓 <b>Target Degree:</b> ${escapeHtml(level)}\n` +
          `• 💎 <b>Membership:</b> ${escapeHtml(user.premiumTier || "Free")}\n\n` +
          `🚀 You can now browse universities, explore English-taught degrees, track documents, and practice entrance exams!`;

    // Edit the previous message to congratulations card
    try {
      await ctx.editMessageText(congratsText, { parse_mode: "HTML" });
    } catch {}

    // Send main menu reply keyboard
    await ctx.reply(`🏠 <b>${escapeHtml(user.lang === "uz" ? "Bosh Menyu Ochildi" : "Main Menu Unlocked")}</b>`, {
      parse_mode: "HTML",
      reply_markup: getMainMenuKeyboard(user.lang),
    });
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

    // ================= UPFRONT STUDENT ONBOARDING STEPS =================
    if (!user.isRegistered && !user.isAdmin) {
      await cleanUpInput(ctx, userId);

      // Step 1: Full Name -> Prompt Phone
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
              `Iltimos, telefon raqamingizni yozib yuboring (masalan: <code>+998901234567</code>):`
            : `👋 Nice to meet you, <b>${escapeHtml(text)}</b>!\n\n` +
              `📞 <b>Step 2 of 3: Phone Number</b>\n` +
              `Please reply with your phone number (e.g. <code>+998901234567</code>):`;

        const msg = await ctx.reply(phonePrompt, {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true },
        });
        db.setLastPromptMsgId(userId, msg.message_id);
        return;
      }

      // Step 2: Phone -> Prompt Degree Level Directly
      if (user.waitingFor === "registration_phone") {
        db.updateUser(userId, { phone: text });
        db.setWaitingFor(userId, "registration_level");

        const levelPrompt =
          user.lang === "uz"
            ? `🎓 <b>3-Qadam (3 tadan): Qaysi Bosqichda O'qimoqchisiz?</b>\n\n` +
              `Polshada maqsad qilgan ta'lim darajangizni tanlang:`
            : `🎓 <b>Step 3 of 3: Target Degree Level</b>\n\n` +
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

        if (app) {
          try {
            await bot.api.sendMessage(
              app.userId,
              `💬 <b>Counselor Feedback on Application #${escapeHtml(app.id)}:</b>\n\n` +
                `"${escapeHtml(text)}"\n\n` +
                `🏛️ <b>University:</b> ${escapeHtml(app.university)}\n` +
                `📘 <b>Program:</b> ${escapeHtml(app.programName)}\n\n` +
                `Please review your documents and update your dossier.`,
              { parse_mode: "HTML" }
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

        try {
          await bot.api.sendMessage(
            targetUserId,
            `🔴 <b>Document Correction Required: ${escapeHtml(docKey.toUpperCase())}</b>\n\n` +
              `💬 <b>Counselor Note:</b> "${escapeHtml(text)}"\n\n` +
              `Please upload a revised copy in the <b>Document Checklist</b> menu.`,
            { parse_mode: "HTML" }
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
      const tier = (parts[1] || "Full Premium") as PremiumTier;
      const maxUses = parseInt(parts[2] || "1", 10);

      if (code) {
        const created = db.createPromoCode({
          code,
          tier,
          maxUses,
        });

        await ctx.reply(
          `✅ <b>Promo Code Created!</b>\n\n` +
            `• 🔑 Code: <code>${escapeHtml(created.code)}</code>\n` +
            `• 💎 Tier: <b>${escapeHtml(created.tier)}</b>\n` +
            `• 👥 Max Uses: <b>${created.maxUses} (Single User)</b>`,
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
      const res = db.redeemPromoCode(text, userId);
      const isUz = user.lang === "uz";

      if (res.success) {
        const successMsg = isUz
          ? `🎉 <b>TABRIKLAYMIZ!</b>\n\n` +
            `Siz kiritgan <code>${escapeHtml(text.toUpperCase())}</code> promokodi muvaffaqiyatli faollashtirildi!\n` +
            `🌟 <b>Ochilgan A'zolik Darajasi:</b> <b>${escapeHtml(res.tier)}</b>\n\n` +
            `• Hujjatlar nazorati va qabul hujjatlarini yuklash imkoniyati\n` +
            `• Kirish imtihonlari va fan testlariga to'liq kirish\n` +
            `• Universitetlarga to'g'ridan-to'g'ri ariza topshirish huquqi\n` +
            `• Rasmiy maslahatchilar tomonidan hujjatlarni to'liq tekshirish\n` +
            `• Rasmiy NAWA SYRENA nostrifikatsiyasi va Polsha qasamyodli tarjimalari\n` +
            `• Shaxsiy koordinator: <a href="https://t.me/poland_admissions_bot">Admissions Team</a>`
          : `🎉 <b>CONGRATULATIONS!</b>\n\n` +
            `Your code <code>${escapeHtml(text.toUpperCase())}</code> has been redeemed!\n` +
            `🌟 <b>Unlocked Tier:</b> <b>${escapeHtml(res.tier)}</b>\n\n` +
            `• Full access to Document Checklist & Certified Advisor Verification\n` +
            `• Full access to University Entrance & Placement Exams\n` +
            `• Direct university application filing\n` +
            `• Official NAWA SYRENA legalization & sworn translations\n` +
            `• Direct contact: <a href="https://t.me/poland_admissions_bot">Admissions Team</a>`;

        await ctx.reply(successMsg, { parse_mode: "HTML" });
      } else {
        const failMsg = isUz
          ? `❌ <b>Faollashtirish Amalga Oshmadi</b>\n\n` +
            `Sabab: ${escapeHtml(res.error || "Kod topilmadi")}.\n` +
            `Iltimos, kiritilgan kodni tekshiring yoki yangi kod olish uchun maslahatchi bilan bog'laning:`
          : `❌ <b>Activation Failed</b>\n\n` +
            `Reason: ${escapeHtml(res.error || "Code not recognized")}.\n` +
            `Please contact your consultant or tap below to purchase a code:`;

        await ctx.reply(failMsg, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
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

    // 11. Super Admin Appoint User
    if (user.waitingFor === ("admin_super_appoint_user" as any)) {
      await cleanUpInput(ctx, userId);
      db.setWaitingFor(userId, null);
      if (!isSuperAdmin(userId)) return;

      const q = text.replace("@", "").trim();
      let targetUser: UserSessionData | undefined;

      if (/^\d+$/.test(q)) {
        targetUser = db.getUser(parseInt(q, 10));
      } else {
        const found = db.searchUsers(q);
        targetUser = found[0];
      }

      if (targetUser) {
        db.updateUser(targetUser.userId, { isAdmin: true });
        db.logAdminAction(
          userId,
          "Super Admin",
          "APPOINT_ADMIN",
          `Appointed User #${targetUser.userId} (${targetUser.fullName || targetUser.username || "User"}) as Admin`,
          targetUser.userId.toString()
        );

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

    return next();
  });
}
