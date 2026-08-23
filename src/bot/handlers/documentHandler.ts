import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { getDocumentsKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";
import { checkPremiumAccess } from "../utils/paywall";

export function setupDocumentHandler(bot: Bot) {
  const handleDocumentsMenu = async (ctx: Context) => {
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

    const hasAccess = await checkPremiumAccess(
      ctx,
      user,
      {
        en: "Document Checklist & Advisor Verification",
        uz: "Hujjatlar Nazorati va Qabul Hujjatlarini Tekshirish",
      },
      "NAWA_FULL"
    );
    if (!hasAccess) return;

    const docDefs = db.getDocumentDefinitions();
    const docs = user.documents || {};
    const totalCount = Object.keys(docDefs).length;
    const approvedCount = Object.values(docs).filter((d) => d.status === "approved").length;
    const reviewingCount = Object.values(docs).filter((d) => d.status === "reviewing").length;

    const filled = totalCount > 0 ? Math.max(0, Math.min(10, Math.round((approvedCount / totalCount) * 10))) : 0;
    const progressBar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);

    const text = isUz
      ? `📁 <b>Hujjatlar Nazorati va Holati</b>\n\n` +
        `📊 <b>Hujjatlar Tayyorgarligi:</b>\n` +
        `${progressBar} <b>${approvedCount}/${totalCount} Tasdiqlangan</b>\n` +
        `• ✅ Tasdiqlangan: <b>${approvedCount}</b> ta\n` +
        `• 🟡 Tekshiruvda: <b>${reviewingCount}</b> ta\n\n` +
        `<i>Talablarni ko'rish, PDF/rasm yuklash yoki havola yuborish uchun pastdagi hujjatlardan birini tanlang:</i>`
      : `📁 <b>Document Verification Checklist</b>\n\n` +
        `📊 <b>Readiness Progress:</b>\n` +
        `${progressBar} <b>${approvedCount}/${totalCount} Verified</b>\n` +
        `• ✅ Approved: <b>${approvedCount}</b>\n` +
        `• 🟡 In Review: <b>${reviewingCount}</b>\n\n` +
        `<i>Tap any document below to inspect requirements, upload a PDF/photo, or submit a cloud link:</i>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getDocumentsKeyboard(user.lang, docs, docDefs),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getDocumentsKeyboard(user.lang, docs, docDefs),
    });
  };

  bot.command("documents", async (ctx) => handleDocumentsMenu(ctx));
  bot.callbackQuery("menu_docs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleDocumentsMenu(ctx);
  });
  bot.hears([/.*Document Checklist.*/i, /.*Hujjatlar.*/i, /.*Documents.*/i], async (ctx) => handleDocumentsMenu(ctx));

  // Inspect individual document & enter/upload option (edit in place)
  bot.callbackQuery(/^doc_action_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^doc_action_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const docDef = db.getDocumentDefinition(docKey);
    const userDoc = user.documents?.[docKey] || { status: "missing" };
    const statusLabel = isUz
      ? userDoc.status === "approved"
        ? "✅ QABUL QILINDI VA TASDIQLANDI"
        : userDoc.status === "reviewing"
        ? "🟡 MASLAHATCHI TEKSHIRUVIDA"
        : userDoc.status === "needs_correction"
        ? "🔴 TUZATISH TALAB ETILADI"
        : "⚪ YUKLANMAGAN"
      : userDoc.status === "approved"
      ? "✅ APPROVED & VERIFIED"
      : userDoc.status === "reviewing"
      ? "🟡 UNDER ADVISOR REVIEW"
      : userDoc.status === "needs_correction"
      ? "🔴 CORRECTION REQUIRED"
      : "⚪ NOT UPLOADED YET";

    const docName = docDef ? (docDef.name[user.lang] || docDef.name.en) : docKey;
    const docDesc = docDef ? (docDef.desc[user.lang] || docDef.desc.en) : "";
    const reqText = isUz
      ? (docDef?.required ? "Majburiy" : "Ixtiyoriy")
      : (docDef?.required ? "Mandatory" : "Optional");

    let text = isUz
      ? `📄 <b>${escapeHtml(docName)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 📌 <b>Holati:</b> <code>${statusLabel}</code>\n` +
        `• ⭐ <b>Talab darajasi:</b> ${reqText}\n\n` +
        `📝 <b>Yo'riqnoma va Talablar:</b>\n${escapeHtml(docDesc)}\n\n`
      : `📄 <b>${escapeHtml(docName)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 📌 <b>Status:</b> <code>${statusLabel}</code>\n` +
        `• ⭐ <b>Requirement:</b> ${reqText}\n\n` +
        `📝 <b>Guide & Specifications:</b>\n${escapeHtml(docDesc)}\n\n`;

    if (userDoc.link) {
      text += isUz
        ? `🔗 <b>Yuborilgan havola:</b> <a href="${escapeHtml(userDoc.link)}">${escapeHtml(userDoc.link)}</a>\n\n`
        : `🔗 <b>Submitted Link:</b> <a href="${escapeHtml(userDoc.link)}">${escapeHtml(userDoc.link)}</a>\n\n`;
    }
    if (userDoc.fileId) {
      text += isUz
        ? `📁 <b>Yuklangan fayl:</b> <code>${escapeHtml(userDoc.fileName || "Hujjat fayli")}</code>\n\n`
        : `📁 <b>Uploaded File:</b> <code>${escapeHtml(userDoc.fileName || "Document file")}</code>\n\n`;
    }
    if (userDoc.feedbackNote) {
      text += isUz
        ? `💬 <b>Maslahatchi Izohi:</b>\n<i>"${escapeHtml(userDoc.feedbackNote)}"</i>\n\n`
        : `💬 <b>Counselor Feedback Note:</b>\n<i>"${escapeHtml(userDoc.feedbackNote)}"</i>\n\n`;
    }

    text += isUz
      ? `👇 <i>PDF fayl yuborish, rasm yuklash yoki havola kiritish uchun pastdagi tugmani bosing:</i>`
      : `👇 <i>Tap below to upload a PDF, send a photo, or paste a link:</i>`;

    const uploadBtnText = userDoc.status === "needs_correction"
      ? (isUz ? "🔄 Qayta Yuklash (To'g'rilash)" : "🔄 Re-upload (Corrected File)")
      : (userDoc.status === "approved"
        ? (isUz ? "🔄 Yangi Nusxa Yuklash" : "🔄 Upload New Version")
        : (isUz ? "📤 Hujjat yoki Havola Yuborish" : "📤 Upload / Send File or Link"));

    const kb = {
      inline_keyboard: isUz
        ? [
            [{ text: uploadBtnText, callback_data: `doc_upload_prompt_${docKey}` }],
            [{ text: "◀️ Hujjatlar Ro'yxatiga", callback_data: "back_to_docs" }, { text: "🏠 Bosh Menyu", callback_data: "go_main_menu" }],
          ]
        : [
            [{ text: uploadBtnText, callback_data: `doc_upload_prompt_${docKey}` }],
            [{ text: "◀️ Back to Documents", callback_data: "back_to_docs" }, { text: "🏠 Main Menu", callback_data: "go_main_menu" }],
          ],
    };

    await ctx.answerCallbackQuery();
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

  // Prompt for upload
  bot.callbackQuery(/^doc_upload_prompt_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^doc_upload_prompt_(.+)$/);
    if (!match) return;
    const docKey = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const hasAccess = await checkPremiumAccess(
      ctx,
      user,
      {
        en: "Certified Document Verification & Counselor Review",
        uz: "Hujjatlarni Rasmiy Tekshirish va Maslahatchi Tasdig'i",
      },
      "NAWA_FULL"
    );
    if (!hasAccess) return;

    const docDef = db.getDocumentDefinition(docKey);
    const docName = docDef ? (docDef.name[user.lang] || docDef.name.en) : docKey;
    db.setWaitingFor(userId, "document_upload", { docKey });

    await ctx.answerCallbackQuery();

    const promptText = isUz
      ? `📤 <b>${escapeHtml(docName)} hujjatini yuklash:</b>\n\n` +
        `Siz quyidagi usullardan birini tanlashingiz mumkin:\n` +
        `1. 📁 <b>PDF yoki DOCX fayl</b> yuboring\n` +
        `2. 🖼️ <b>Sifatli fotosurat</b> yuboring\n` +
        `3. 🔗 <b>Google Drive / OneDrive havolasini</b> yozib yuboring\n\n` +
        `<i>Hujjat fayli yoki havolani shu yerga yuboring:</i>`
      : `📤 <b>Upload ${escapeHtml(docName)}:</b>\n\n` +
        `You can:\n` +
        `1. 📁 <b>Send a Document directly</b> (PDF, DOCX, etc.)\n` +
        `2. 🖼️ <b>Send a Photo scan</b> from your gallery\n` +
        `3. 🔗 <b>Paste a shareable link</b> (Google Drive, OneDrive, Dropbox)\n\n` +
        `<i>Send your file or link in the chat now:</i>`;

    const msg = await ctx.reply(promptText, { parse_mode: "HTML" });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  bot.callbackQuery("back_to_docs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleDocumentsMenu(ctx);
  });
}
