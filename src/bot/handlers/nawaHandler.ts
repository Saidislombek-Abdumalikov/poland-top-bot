import { Bot, Context } from "grammy";
import { db, defaultNawaDefinitions } from "../services/db";
import { nawaGuide } from "../data/nawaGuide";
import { getNawaKeyboard, getNawaDocumentsKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";
import { checkPremiumAccess } from "../utils/paywall";
import { NawaDocumentKey } from "../types";

export function setupNawaHandler(bot: Bot) {
  const handleNawaMenu = async (ctx: Context) => {
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

    const title = nawaGuide.title[user.lang] || nawaGuide.title.en;
    const overview = nawaGuide.overview[user.lang] || nawaGuide.overview.en;

    const text = isUz
      ? `🏛️ <b>${escapeHtml(title)}</b>\n\n` +
        `${overview}\n\n` +
        `👇 <i>Batafsil ma'lumot olish yoki arizangizni ro'yxatdan o'tkazish uchun pastdagi bo'limlardan birini tanlang:</i>`
      : `🏛️ <b>${escapeHtml(title)}</b>\n\n` +
        `${overview}\n\n` +
        `👇 <i>Select an option below to learn more or register your document dossier:</i>`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang),
    });
  };

  bot.command("nawa", async (ctx) => handleNawaMenu(ctx));
  bot.callbackQuery("menu_nawa", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleNawaMenu(ctx);
  });
  bot.hears([/.*NAWA.*/i, /.*Nostrifikatsiya.*/i], async (ctx) => handleNawaMenu(ctx));

  // View Step-by-Step Roadmap (edit in place)
  bot.callbackQuery("nawa_view_steps", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    let text = isUz
      ? `🏛️ <b>NAWA Nostrifikatsiya Bosqichlari va Yo'l Xaritasi:</b>\n\n`
      : `🏛️ <b>NAWA Legalization Roadmap & Steps:</b>\n\n`;

    nawaGuide.steps.forEach((s) => {
      const stepTitle = s.title[user.lang] || s.title.en;
      const stepDesc = s.desc[user.lang] || s.desc.en;
      text += `<b>${escapeHtml(stepTitle)}</b>\n${escapeHtml(stepDesc)}\n\n`;
    });

    text += isUz
      ? `💰 <b>Davlat Boji:</b> 200 PLN (~45 EUR)\n⏱️ <b>Ko'rib Chiqish Muddati:</b> 3-6 hafta`
      : `💰 <b>Fee:</b> 200 PLN (~45 EUR)\n⏱️ <b>Processing Time:</b> 3-6 weeks`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang),
    });
  });

  // Check Eligibility (edit in place)
  bot.callbackQuery("nawa_check_eligibility", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const text = isUz
      ? `🔍 <b>Menga NAWA Nostrifikatsiyasi Kerakmi?</b>\n\n` +
        `✅ <b>HA, sizga NAWA/Kuratorium talab qilinadi, agar:</b>\n` +
        `• Attestat yoki universitetingiz diplomi Yevropa Ittifoqi/Iqtisodiy Hamkorlik Tashkilotidan tashqarida berilgan bo'lsa (masalan: <b>O'zbekiston, Qozog'iston, Ozarbayjon, Turkiya, BAA</b>).\n` +
        `• Polsha davlat yoki xususiy universitetlariga o'qishga topshirayotgan bo'lsangiz.\n\n` +
        `❌ <b>Sizga NAWA kerak EMAS, agar:</b>\n` +
        `• Diplomingiz <b>Yevropa Ittifoqi (EU / EEA / OECD)</b> davlatlarida berilgan bo'lsa.\n` +
        `• Sizda <b>International Baccalaureate (IB)</b> yoki <b>European Baccalaureate (EB)</b> xalqaro diplomi bo'lsa.`
      : `🔍 <b>Do I need NAWA Recognition?</b>\n\n` +
        `✅ <b>YES, you NEED NAWA/Kuratorium if:</b>\n` +
        `• Your high school diploma or university degree was issued outside the EU/EEA/OECD (e.g. <b>Uzbekistan, Kazakhstan, Azerbaijan, Turkey, Iran, India, UAE</b>).\n` +
        `• You are applying for Polish public or private university admissions.\n\n` +
        `❌ <b>You DO NOT need NAWA if:</b>\n` +
        `• Your diploma was issued in the <b>EU / EEA / OECD</b> countries.\n` +
        `• You hold an <b>International Baccalaureate (IB)</b> or <b>European Baccalaureate (EB)</b> diploma.`;

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang),
    });
  });

  // FAQ (edit in place)
  bot.callbackQuery("nawa_faq", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    let text = isUz
      ? `❓ <b>NAWA va Nostrifikatsiya Bo'yicha Tez-tez Beriladigan Savollar:</b>\n\n`
      : `❓ <b>NAWA Legalization FAQ:</b>\n\n`;

    nawaGuide.faq.forEach((f, idx) => {
      const q = f.q[user.lang] || f.q.en;
      const a = f.a[user.lang] || f.a.en;
      text += `<b>${idx + 1}. ${escapeHtml(q)}</b>\n${escapeHtml(a)}\n\n`;
    });

    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getNawaKeyboard(user.lang),
        });
        return;
      } catch {}
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getNawaKeyboard(user.lang),
    });
  });

  // Dedicated NAWA Documents & Dossier View
  const handleNawaDossierView = async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const hasAccess = await checkPremiumAccess(
      ctx,
      user,
      {
        en: "NAWA SYRENA Legalization Dossier & Document Upload",
        uz: "NAWA Nostrifikatsiya Hujjatlar Dosyesi va Nazorati",
      },
      "NAWA"
    );
    if (!hasAccess) return;

    // Ensure NAWA application is created
    let nawaApp = db.getUserNawaApplications(userId)[0];
    if (!nawaApp) {
      nawaApp = db.createNawaApplication(userId);
    }

    const nawaDocs = db.getUserNawaDocuments(userId);
    const docKeys: NawaDocumentKey[] = ["attestat", "shahodatnoma", "email", "home_address", "passport_red"];
    const totalCount = docKeys.length;
    const approvedCount = docKeys.filter((k) => nawaDocs[k]?.status === "approved").length;
    const reviewingCount = docKeys.filter((k) => nawaDocs[k]?.status === "reviewing").length;
    const correctionCount = docKeys.filter((k) => nawaDocs[k]?.status === "needs_correction").length;
    const uploadedCount = docKeys.filter(
      (k) => nawaDocs[k]?.status !== "missing" && (!!nawaDocs[k]?.fileId || !!nawaDocs[k]?.value)
    ).length;

    const filled = Math.max(0, Math.min(10, Math.round((approvedCount / totalCount) * 10)));
    const progressBar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);

    let docChecklistText = "";
    docKeys.forEach((key, idx) => {
      const def = defaultNawaDefinitions[key];
      const doc = nawaDocs[key];
      const name = isUz ? def.name.uz : def.name.en;
      const statusIcon =
        doc?.status === "approved"
          ? "✅"
          : doc?.status === "reviewing"
          ? "🟡"
          : doc?.status === "needs_correction"
          ? "🔴"
          : "⚪";
      const statusText = isUz
        ? doc?.status === "approved"
          ? "Qabul qilingan"
          : doc?.status === "reviewing"
          ? "Tekshiruvda"
          : doc?.status === "needs_correction"
          ? "Qayta yuklash kerak"
          : "Kiritilmagan"
        : doc?.status === "approved"
        ? "Approved"
        : doc?.status === "reviewing"
        ? "In Review"
        : doc?.status === "needs_correction"
        ? "Correction Required"
        : "Missing";

      let detailVal = "";
      if (doc?.value) {
        detailVal = ` (<code>${escapeHtml(doc.value)}</code>)`;
      } else if (doc?.fileName) {
        detailVal = ` (<code>${escapeHtml(doc.fileName)}</code>)`;
      }

      let feedbackNote = "";
      if (doc?.counselorFeedback) {
        feedbackNote = `\n   ↳ <i>💬 Izoh: ${escapeHtml(doc.counselorFeedback)}</i>`;
      }

      docChecklistText += `${idx + 1}. ${def.icon} <b>${escapeHtml(name)}:</b> ${statusIcon} ${statusText}${detailVal}${feedbackNote}\n`;
    });

    const text = isUz
      ? `🏛️ <b>NAWA NOSTRIFIKATSIYA HUJJATLAR DOSYESI</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 👤 <b>Talaba:</b> <b>${escapeHtml(user.fullName || user.firstName || "Talaba")}</b>\n` +
        `• 📌 <b>Ariza Holati:</b> <code>${escapeHtml(nawaApp.stage)}</code>\n` +
        (nawaApp.counselorNote ? `• 💬 <b>Maslahatchi Xabari:</b> <i>\"${escapeHtml(nawaApp.counselorNote)}\"</i>\n` : "") +
        `• 📊 <b>NAWA Tayyorgarligi:</b> <b>${approvedCount}/${totalCount} Tasdiqlangan</b> (${Math.round((approvedCount / totalCount) * 100)}%)\n` +
        `${progressBar}\n\n` +
        `📋 <b>NAWA Uchun Talab Qilinadigan 5 ta Hujjat:</b>\n` +
        `${docChecklistText}\n` +
        `👇 <i>Hujjat faylini yuklash yoki ma'lumotni kiritish uchun quyidagi tugmalardan birini bosing:</i>`
      : `🏛️ <b>NAWA LEGALIZATION DOCUMENT DOSSIER</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `• 👤 <b>Student:</b> <b>${escapeHtml(user.fullName || user.firstName || "Student")}</b>\n` +
        `• 📌 <b>Application Stage:</b> <code>${escapeHtml(nawaApp.stage)}</code>\n` +
        (nawaApp.counselorNote ? `• 💬 <b>Advisor Note:</b> <i>\"${escapeHtml(nawaApp.counselorNote)}\"</i>\n` : "") +
        `• 📊 <b>NAWA Readiness:</b> <b>${approvedCount}/${totalCount} Approved</b> (${Math.round((approvedCount / totalCount) * 100)}%)\n` +
        `${progressBar}\n\n` +
        `📋 <b>Required 5 NAWA Documents:</b>\n` +
        `${docChecklistText}\n` +
        `👇 <i>Tap below to upload files or enter data for each requirement:</i>`;

    const kb = getNawaDocumentsKeyboard(user.lang, nawaDocs);

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: kb,
        });
        return;
      } catch {}
    }

    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  };

  bot.callbackQuery("nawa_my_dossier", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleNawaDossierView(ctx);
  });

  // Prompt for specific NAWA document upload / text entry
  bot.callbackQuery(/^nawa_doc_prompt_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^nawa_doc_prompt_(.+)$/);
    if (!match) return;
    const docKey = match[1] as NawaDocumentKey;
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const hasAccess = await checkPremiumAccess(
      ctx,
      user,
      {
        en: "NAWA SYRENA Legalization Dossier & Document Upload",
        uz: "NAWA Nostrifikatsiya Hujjatlar Dosyesi va Nazorati",
      },
      "NAWA"
    );
    if (!hasAccess) return;

    const def = defaultNawaDefinitions[docKey];
    if (!def) return;

    db.setWaitingFor(userId, "nawa_document_upload", { nawaDocKey: docKey });
    await ctx.answerCallbackQuery();

    const docName = isUz ? def.name.uz : def.name.en;
    const docDesc = isUz ? def.description.uz : def.description.en;

    let promptText = "";
    if (docKey === "email") {
      promptText = isUz
        ? `📧 <b>Email pochta manzilingizni kiriting:</b>\n\n` +
          `• ℹ️ <i>${escapeHtml(docDesc)}</i>\n\n` +
          `Iltimos, o'zingizning doimiy va faol elektron pochta manzilingizni yozib yuboring:\n` +
          `(Masalan: <code>talaba@gmail.com</code>)`
        : `📧 <b>Enter your active Email Address:</b>\n\n` +
          `• ℹ️ <i>${escapeHtml(docDesc)}</i>\n\n` +
          `Please send your primary email address in chat:\n` +
          `(Example: <code>student@gmail.com</code>)`;
    } else if (docKey === "home_address") {
      promptText = isUz
        ? `🏠 <b>Yashash manzilingizni kiriting:</b>\n\n` +
          `• ℹ️ <i>${escapeHtml(docDesc)}</i>\n\n` +
          `Iltimos, to'liq yashash manzilingizni yozib yuboring:\n` +
          `(Masalan: <i>Toshkent shahar, Yunusobod tumani, 4-mavze, 12-uy, 45-xonadon</i>)`
        : `🏠 <b>Enter your Home Address:</b>\n\n` +
          `• ℹ️ <i>${escapeHtml(docDesc)}</i>\n\n` +
          `Please send your full residential home address in chat:\n` +
          `(Example: <i>Tashkent city, Yunusabad district, Block 4, House 12, Apt 45</i>)`;
    } else {
      promptText = isUz
        ? `📤 <b>${def.icon} ${escapeHtml(docName)} hujjatini yuklash:</b>\n\n` +
          `• ℹ️ <i>${escapeHtml(docDesc)}</i>\n\n` +
          `Siz quyidagi usullardan birini tanlashingiz mumkin:\n` +
          `1. 📁 <b>PDF fayl</b> yuboring\n` +
          `2. 🖼️ <b>Sifatli fotosurat</b> yuboring\n` +
          `3. 🔗 <b>Google Drive havolasini</b> yozib yuboring\n\n` +
          `<i>Hujjat fayli yoki fotosuratini shu chatga yuboring:</i>`
        : `📤 <b>${def.icon} Upload ${escapeHtml(docName)}:</b>\n\n` +
          `• ℹ️ <i>${escapeHtml(docDesc)}</i>\n\n` +
          `You can:\n` +
          `1. 📁 <b>Send a PDF document</b>\n` +
          `2. 🖼️ <b>Send a high-resolution Photo scan</b>\n` +
          `3. 🔗 <b>Paste a Google Drive / OneDrive link</b>\n\n` +
          `<i>Send your file or photo scan in the chat now:</i>`;
    }

    const kb = {
      inline_keyboard: [
        [{ text: isUz ? "◀️ NAWA Dosyesiga Qaytish" : "◀️ Back to NAWA Dossier", callback_data: "nawa_my_dossier" }],
      ],
    };

    const msg = await ctx.reply(promptText, { parse_mode: "HTML", reply_markup: kb });
    db.setLastPromptMsgId(userId, msg.message_id);
  });

  // NAWA Dossier Wizard (Premium Gated)
  bot.callbackQuery("nawa_apply_wizard", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const hasAccess = await checkPremiumAccess(
      ctx,
      user,
      {
        en: "NAWA SYRENA Legalization Assistance Dossier",
        uz: "NAWA SYRENA Nostrifikatsiya Huquqiy Ko'magi",
      },
      "NAWA"
    );
    if (!hasAccess) return;

    db.createNawaApplication(userId, {
      country: user.country || "Uzbekistan",
    });

    await ctx.answerCallbackQuery();

    const text = isUz
      ? `🏛️ <b>NAWA Nostrifikatsiya Hujjatlar Paketi Ochildi!</b>\n\n` +
        `• 📋 Qabul Koordinatoringiz: <b>PTU Legal Team</b>\n` +
        `• 📌 Holati: <b>Hujjatlarni Qabul Qilish (Topshirilgan)</b>\n\n` +
        `NAWA nostrifikatsiyasi uchun quyidagi 5 ta hujjat talab etiladi:\n` +
        `1. 📜 <b>Attestat</b> (11-sinf maktab attestati)\n` +
        `2. 📜 <b>Shahodatnoma</b> (9-sinf shahodatnomasi)\n` +
        `3. 📧 <b>Email</b> (Faol elektron pochta)\n` +
        `4. 🏠 <b>Yashash Manzili</b> (Home address)\n` +
        `5. 📕 <b>Pasport (qizil)</b> (Xorijga chiqish pasporti)\n\n` +
        `<i>Hujjatlarni yuklash uchun pastdagi tugmani bosing:</i>`
      : `🏛️ <b>NAWA Legalization Dossier Initiated!</b>\n\n` +
        `• 📋 Assigned Advisor: <b>PTU Legal Team</b>\n` +
        `• 📌 Status: <b>Dossier Opened (Submitted)</b>\n\n` +
        `The following 5 dedicated documents are required for NAWA recognition:\n` +
        `1. 📜 <b>Attestat</b> (High School Certificate)\n` +
        `2. 📜 <b>Shahodatnoma</b> (9th Grade Certificate)\n` +
        `3. 📧 <b>Email</b> (Active Email Address)\n` +
        `4. 🏠 <b>Home Address</b> (Full Residential Address)\n` +
        `5. 📕 <b>Passport (Red)</b> (International Passport)\n\n` +
        `<i>Tap below to open your NAWA Document Dossier and begin uploading:</i>`;

    const kb = {
      inline_keyboard: [
        [{ text: isUz ? "📁 NAWA Hujjatlar Dosyesi" : "📁 NAWA Document Dossier", callback_data: "nawa_my_dossier" }],
        [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
      ],
    };

    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });
}
