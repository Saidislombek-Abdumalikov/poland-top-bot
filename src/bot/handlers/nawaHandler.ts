import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { nawaGuide } from "../data/nawaGuide";
import { getNawaKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";
import { checkPremiumAccess } from "../utils/paywall";

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

  // NAWA Dossier Wizard (Premium Gated)
  bot.callbackQuery("nawa_apply_wizard", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "NAWA SYRENA Legalization Assistance Dossier",
      uz: "NAWA SYRENA Nostrifikatsiya Huquqiy Ko'magi",
    });
    if (!hasAccess) return;

    db.createNawaApplication(userId, {
      country: user.country || "Uzbekistan",
      passportNumber: "Pending Upload",
      diplomaLink: "Pending Upload",
    });

    await ctx.answerCallbackQuery();

    const text = isUz
      ? `🏛️ <b>NAWA Nostrifikatsiya Hujjatlar Paketi Ro'yxatdan O'tkazildi!</b>\n\n` +
        `• 📋 Qabul Koordinatoringiz: <b>PTU Legal Team</b>\n` +
        `• 📌 Holati: <b>Hujjatlarni Qabul Qilish (Topshirilgan)</b>\n\n` +
        `Iltimos, pastdagi tugma orqali <b>Hujjatlar Nazorati</b> bo'limiga o'ting va pasport, attestat/diplom, apostil va qasamyodli tarjimalaringizni yuklang!`
      : `🏛️ <b>NAWA Legalization Dossier Initiated!</b>\n\n` +
        `• 📋 Assigned Advisor: <b>PTU Legal Team</b>\n` +
        `• 📌 Status: <b>Dossier Opened (Submitted)</b>\n\n` +
        `Please tap below to open the <b>Document Checklist</b> and upload your passport, diploma, apostille, and sworn translations!`;

    const kb = {
      inline_keyboard: [
        [{ text: isUz ? "📁 Hujjatlarni Yuklash & Nazorat" : "📁 Document Checklist & Upload", callback_data: "menu_docs" }],
        [{ text: isUz ? "🏠 Bosh Menyu" : "🏠 Main Menu", callback_data: "go_main_menu" }],
      ],
    };

    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  });
}
