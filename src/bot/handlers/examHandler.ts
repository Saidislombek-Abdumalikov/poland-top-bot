import { Bot, Context } from "grammy";
import { db } from "../services/db";
import { t } from "../locales";
import { examSubjects } from "../data/exams";
import { getExamsListKeyboard, getQuizQuestionKeyboard } from "../keyboards/menuKeyboards";
import { escapeHtml } from "../utils/format";
import { checkPremiumAccess } from "../utils/paywall";

export function setupExamHandler(bot: Bot) {
  const handleExamsMenu = async (ctx: Context) => {
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

    const hasAccess = await checkPremiumAccess(ctx, user, {
      en: "Practice Exams & University Placement Tests",
      uz: "Kirish Imtihonlari va Test Mashqlari",
    });
    if (!hasAccess) return;

    const title = t(user.lang, "exams_title");
    const choose = t(user.lang, "exam_choose_subject");

    const text = isUz
      ? `✍️ <b>Mashq Imtihonlari va Kirish Testlari</b>\n\n` +
        `Polsha universitetlarining kirish imtihonlari va til testlariga tayyorlaning:\n\n` +
        `🎯 ${escapeHtml(choose)}`
      : `✍️ <b>Practice Exams & Placement Tests</b>\n\n` +
        `Prepare for Polish university entrance exams and language assessments:\n\n` +
        `🎯 ${escapeHtml(choose)}`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getExamsListKeyboard(user.lang, examSubjects),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getExamsListKeyboard(user.lang, examSubjects),
    });
  };

  bot.command("exams", async (ctx) => handleExamsMenu(ctx));
  bot.callbackQuery("menu_exams", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleExamsMenu(ctx);
  });
  bot.hears([/.*Practice Exams.*/i, /.*Mashq Imtihonlari.*/i, /.*Exams.*/i], async (ctx) => handleExamsMenu(ctx));

  // Start exam session (edit in place)
  bot.callbackQuery(/^start_exam_(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^start_exam_(.+)$/);
    if (!match) return;
    const examId = match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const subject = examSubjects.find((s) => s.id === examId);
    if (!subject || subject.questions.length === 0) {
      await ctx.answerCallbackQuery({ text: isUz ? "Test topilmadi" : "Test not found" });
      return;
    }

    // Polish B1 is free demo. Other subject tests require VIP Premium.
    if (examId !== "polish-b1") {
      const hasAccess = await checkPremiumAccess(ctx, user, {
        en: "Full University Entrance & Placement Exams",
        uz: "To'liq Kirish Imtihonlari va Fan Testlari",
      });
      if (!hasAccess) return;
    }

    // Initialize quiz in user storage
    db.updateUser(userId, {
      activeQuiz: {
        examId,
        currentQ: 0,
        answers: {},
        score: 0,
      },
    });

    const firstQ = subject.questions[0];
    const subName = subject.name[user.lang] || subject.name.en;
    const qText = firstQ.q[user.lang] || firstQ.q.en;

    const text = isUz
      ? `📝 <b>${escapeHtml(subName)}</b>\n` +
        `⏱️ <b>Vaqt chegarasi:</b> ${subject.timeMinutes} daqiqa | 📊 <b>Jami:</b> ${subject.questions.length} ta savol\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>1-Savol (Jami ${subject.questions.length} tadan):</b>\n\n` +
        `❓ ${escapeHtml(qText)}`
      : `📝 <b>${escapeHtml(subName)}</b>\n` +
        `⏱️ <b>Time limit:</b> ${subject.timeMinutes} min | 📊 <b>Total:</b> ${subject.questions.length} questions\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Question 1 of ${subject.questions.length}:</b>\n\n` +
        `❓ ${escapeHtml(qText)}`;

    await ctx.answerCallbackQuery();

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: getQuizQuestionKeyboard(firstQ.options, 0, examId),
        });
        return;
      } catch {}
    }

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: getQuizQuestionKeyboard(firstQ.options, 0, examId),
    });
  });

  // Handle answers (edit in place)
  bot.callbackQuery(/^quiz_ans_([^_]+)_(\d+)_(\d+)$/, async (ctx) => {
    const match = ctx.callbackQuery?.data?.match(/^quiz_ans_([^_]+)_(\d+)_(\d+)$/);
    if (!match) return;

    const examId = match[1];
    const qIndex = parseInt(match[2], 10);
    const chosenOptIdx = parseInt(match[3], 10);

    const userId = ctx.from?.id;
    if (!userId) return;
    const user = db.getUser(userId);
    const isUz = user.lang === "uz";

    const subject = examSubjects.find((s) => s.id === examId);
    if (!subject) return;

    const currentQuestion = subject.questions[qIndex];
    if (!currentQuestion) return;

    const chosenAnswer = currentQuestion.options[chosenOptIdx];
    const isCorrect = chosenAnswer === currentQuestion.correct;

    const activeQuiz = user.activeQuiz || { examId, currentQ: qIndex, answers: {}, score: 0 };
    activeQuiz.answers[qIndex] = chosenAnswer;
    if (isCorrect) activeQuiz.score += 1;

    const nextQIndex = qIndex + 1;
    activeQuiz.currentQ = nextQIndex;
    db.updateUser(userId, { activeQuiz });

    const feedbackIcon = isCorrect
      ? (isUz ? "✅ To'g'ri javob!" : "✅ Correct!")
      : (isUz ? "❌ Noto'g'ri javob" : "❌ Incorrect");

    await ctx.answerCallbackQuery({ text: feedbackIcon });

    // If quiz completed
    if (nextQIndex >= subject.questions.length) {
      const percentage = Math.round((activeQuiz.score / subject.questions.length) * 100);
      const passed = percentage >= 60;
      const subName = subject.name[user.lang] || subject.name.en;

      const finishText = isUz
        ? `🎉 <b>${escapeHtml(subName)} — Test Yakunlandi!</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📊 <b>Sizning Natijangiz:</b> ${activeQuiz.score} / ${subject.questions.length} (<b>${percentage}%</b>)\n` +
          `📌 <b>Xulosa:</b> ${passed ? "✅ MUVAFFAQIYATLI O'TDINGIZ" : "🔴 KO'PROQ TAYYORGARLIK KERAK"}\n\n` +
          (passed
            ? `🌟 Ajoyib natija! Sizning bilimlaringiz Polsha universitetlariga kirish talablariga mos keladi.`
            : `💡 Xavotir olmang! Mavzularni takrorlab, xohlagan vaqtingiz testni qayta topshirishingiz mumkin.`)
        : `🎉 <b>${escapeHtml(subName)} — Quiz Completed!</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📊 <b>Your Score:</b> ${activeQuiz.score} / ${subject.questions.length} (<b>${percentage}%</b>)\n` +
          `📌 <b>Result:</b> ${passed ? "✅ PASSED" : "🔴 NEEDS MORE PRACTICE"}\n\n` +
          (passed
            ? `🌟 Excellent job! Your knowledge aligns well with Polish university admission standards.`
            : `💡 Don't worry! Review the materials and retake the test when you feel ready.`);

      const kb = {
        inline_keyboard: isUz
          ? [
              [{ text: "🔄 Testni Qayta Topshirish", callback_data: `start_exam_${examId}` }],
              [{ text: "✍️ Boshqa Testlarni Ko'rish", callback_data: "go_exams_menu" }],
              [{ text: "🏠 Bosh Menyu", callback_data: "go_main_menu" }],
            ]
          : [
              [{ text: "🔄 Retake This Test", callback_data: `start_exam_${examId}` }],
              [{ text: "✍️ Explore Other Tests", callback_data: "go_exams_menu" }],
              [{ text: "🏠 Main Menu", callback_data: "go_main_menu" }],
            ],
      };

      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(finishText, { parse_mode: "HTML", reply_markup: kb });
          return;
        } catch {}
      }
      await ctx.reply(finishText, { parse_mode: "HTML", reply_markup: kb });
      return;
    }

    // Next question (edit in place)
    const nextQ = subject.questions[nextQIndex];
    const subName = subject.name[user.lang] || subject.name.en;
    const qText = nextQ.q[user.lang] || nextQ.q.en;

    const nextText = isUz
      ? `📝 <b>${escapeHtml(subName)}</b>\n\n` +
        `<b>${nextQIndex + 1}-Savol (Jami ${subject.questions.length} tadan):</b>\n\n` +
        `❓ ${escapeHtml(qText)}`
      : `📝 <b>${escapeHtml(subName)}</b>\n\n` +
        `<b>Question ${nextQIndex + 1} of ${subject.questions.length}:</b>\n\n` +
        `❓ ${escapeHtml(qText)}`;

    if (ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(nextText, {
          parse_mode: "HTML",
          reply_markup: getQuizQuestionKeyboard(nextQ.options, nextQIndex, examId),
        });
        return;
      } catch {}
    }

    await ctx.reply(nextText, {
      parse_mode: "HTML",
      reply_markup: getQuizQuestionKeyboard(nextQ.options, nextQIndex, examId),
    });
  });

  bot.callbackQuery("go_exams_menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleExamsMenu(ctx);
  });
}
