import { InlineKeyboard, Keyboard } from "grammy";
import { Language, University, Program, ExamSubject, StudentReview } from "../types";
import { t } from "../locales";
import { universities } from "../data/universities";
import { programs } from "../data/programs";

export function getPhoneRequestKeyboard(lang: Language): Keyboard {
  const isUz = lang === "uz";
  return new Keyboard()
    .requestContact(isUz ? "📱 Telefon raqamni yuborish" : "📱 Share Phone Number")
    .resized()
    .oneTime();
}

export function getMainMenuKeyboard(lang: Language): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(lang, "btn_universities"), "menu_unis")
    .text(t(lang, "btn_programs"), "menu_progs")
    .row()
    .text(t(lang, "btn_nawa"), "menu_nawa")
    .text(t(lang, "btn_documents"), "menu_docs")
    .row()
    .text(t(lang, "btn_exams"), "menu_exams")
    .text(t(lang, "btn_premium"), "menu_premium")
    .row()
    .text(t(lang, "btn_reviews"), "menu_reviews")
    .text(t(lang, "btn_profile"), "menu_profile");
}

export function getLanguageInlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🇬🇧 English", "set_lang_en")
    .text("🇺🇿 O'zbekcha", "set_lang_uz");
}

export function getOnboardingLanguageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🇬🇧 English", "onboarding_lang_en")
    .text("🇺🇿 O'zbekcha", "onboarding_lang_uz");
}

export function getOnboardingDegreeKeyboard(lang: Language): InlineKeyboard {
  return new InlineKeyboard()
    .text("🎓 Bachelor's (BSc / BA)", "onboarding_level_Bachelor")
    .row()
    .text("🎓 Master's (MSc / MA)", "onboarding_level_Master")
    .row()
    .text("🏥 Medicine / Pharmacy (MD)", "onboarding_level_PhD")
    .row()
    .text("💼 MBA / Postgraduate", "onboarding_level_MBA");
}

export function getUniversitiesFilterKeyboard(lang: Language, activeCity?: string): InlineKeyboard {
  const cities = ["Warsaw", "Kraków", "Wrocław", "Poznań", "Gdańsk"];
  const kb = new InlineKeyboard();

  cities.forEach((city, index) => {
    const isSelected = activeCity === city;
    kb.text(`${isSelected ? "✅ " : ""}${city}`, `uni_city_${city}`);
    if (index % 2 === 1) kb.row();
  });

  if (activeCity) {
    kb.row().text(`🔄 ${t(lang, "uni_filter_all")}`, "uni_city_all");
  }

  return kb;
}

export function getUniversitiesListKeyboard(
  lang: Language,
  filteredUnis: University[],
  page: number = 0,
  pageSize: number = 5
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageItems = filteredUnis.slice(start, start + pageSize);

  pageItems.forEach((uni) => {
    kb.text(`🏛️ ${uni.name} (${uni.city})`, `view_uni_${uni.id}`);
    if (uni.website) {
      kb.url("🌐 " + (lang === "uz" ? "Sayt" : "Link"), uni.website);
    }
    kb.row();
  });

  const totalPages = Math.ceil(filteredUnis.length / pageSize) || 1;
  const navRow: { text: string; data: string }[] = [];

  if (page > 0) {
    navRow.push({ text: t(lang, "nav_prev"), data: `uni_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navRow.push({ text: t(lang, "nav_next"), data: `uni_page_${page + 1}` });
  }

  if (navRow.length > 0) {
    navRow.forEach((btn) => kb.text(btn.text, btn.data));
    kb.row();
  }

  kb.text(t(lang, "uni_filter_city"), "uni_open_city_filter")
    .text(t(lang, "nav_main_menu"), "go_main_menu");

  return kb;
}

export function getUniversityDetailKeyboard(lang: Language, uni: University): InlineKeyboard {
  const abbr = uni.abbr || "Uni";
  const websiteLabel = lang === "uz" ? "🌐 Rasmiy Veb-Sayt (Havola)" : "🌐 Official Admissions Website (Link)";

  return new InlineKeyboard()
    .url(websiteLabel, uni.website || "https://studyinpoland.pl")
    .row()
    .text(t(lang, "uni_btn_view_programs", { abbr }), `prog_filter_uni_${uni.id}`)
    .row()
    .text(t(lang, "uni_btn_apply"), `apply_uni_${uni.id}`)
    .row()
    .text(t(lang, "nav_back"), "back_to_unis");
}

export function getProgramsFilterKeyboard(
  lang: Language,
  activeFilters: { level?: string; city?: string; field?: string }
): InlineKeyboard {
  const kb = new InlineKeyboard();

  kb.text(`🎓 Level: ${activeFilters.level || "All"}`, "filter_modal_level")
    .text(`🏙️ City: ${activeFilters.city || "All"}`, "filter_modal_city")
    .row()
    .text(`🔬 Field: ${activeFilters.field || "All"}`, "filter_modal_field")
    .text(`🔄 ${t(lang, "prog_filter_clear")}`, "filter_clear")
    .row()
    .text(t(lang, "nav_back"), "go_main_menu");

  return kb;
}

export function getProgramsListKeyboard(
  lang: Language,
  filteredProgs: Program[],
  page: number = 0,
  pageSize: number = 5
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageItems = filteredProgs.slice(start, start + pageSize);

  pageItems.forEach((p) => {
    kb.text(`📘 [${p.level}] ${p.name} - ${p.city}`, `view_prog_${p.id}`).row();
  });

  const totalPages = Math.ceil(filteredProgs.length / pageSize) || 1;
  const navRow: { text: string; data: string }[] = [];

  if (page > 0) {
    navRow.push({ text: t(lang, "nav_prev"), data: `progs_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navRow.push({ text: t(lang, "nav_next"), data: `progs_page_${page + 1}` });
  }

  if (navRow.length > 0) {
    navRow.forEach((btn) => kb.text(btn.text, btn.data));
    kb.row();
  }

  kb.text(`🔍 ${t(lang, "prog_filter_field")}`, "progs_filter_menu")
    .text(t(lang, "nav_main_menu"), "go_main_menu");

  return kb;
}

export function getProgramDetailKeyboard(
  lang: Language,
  progId: string,
  isSaved: boolean
): InlineKeyboard {
  return new InlineKeyboard()
    .text(
      isSaved ? t(lang, "prog_btn_unsave") : t(lang, "prog_btn_save"),
      `toggle_save_${progId}`
    )
    .text(t(lang, "prog_btn_apply"), `apply_prog_${progId}`)
    .row()
    .text(t(lang, "nav_back"), "back_to_progs");
}

export function getNawaKeyboard(lang: Language): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(lang, "nawa_btn_steps"), "nawa_view_steps")
    .row()
    .text(t(lang, "nawa_btn_check"), "nawa_check_eligibility")
    .row()
    .text(t(lang, "nawa_btn_apply_wizard"), "nawa_apply_wizard")
    .row()
    .text(t(lang, "nawa_btn_faq"), "nawa_faq")
    .row()
    .text(t(lang, "nav_main_menu"), "go_main_menu");
}

export function getDocumentsKeyboard(
  lang: Language,
  docs: Record<string, { status: string; link?: string }>,
  docDefs?: Record<string, any>
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const definitions = docDefs || {};

  Object.entries(definitions).forEach(([docKey, def]) => {
    const status = docs[docKey]?.status || "missing";
    const statusIcon =
      status === "approved"
        ? "✅"
        : status === "reviewing"
        ? "🟡"
        : status === "needs_correction"
        ? "🔴"
        : "⚪";

    const name = def.name?.[lang] || def.name?.en || docKey;
    kb.text(`${statusIcon} ${name}`, `doc_action_${docKey}`).row();
  });

  kb.text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}

export function getExamsListKeyboard(lang: Language, examList: ExamSubject[]): InlineKeyboard {
  const kb = new InlineKeyboard();

  examList.forEach((exam) => {
    const isFree = exam.id === "polish-b1";
    const badge = isFree ? "🟢 [Free Demo] " : "🔒 [VIP] ";
    kb.text(`${badge}${exam.name[lang] || exam.name.en}`, `start_exam_${exam.id}`).row();
  });

  kb.text(t(lang, "nav_main_menu"), "go_main_menu");
  return kb;
}

export function getQuizQuestionKeyboard(
  options: string[],
  currentQ: number,
  examId: string
): InlineKeyboard {
  const kb = new InlineKeyboard();

  options.forEach((opt, idx) => {
    kb.text(`${String.fromCharCode(65 + idx)}) ${opt}`, `quiz_ans_${examId}_${currentQ}_${idx}`).row();
  });

  kb.text("❌ Exit Quiz", "exam_cancel");
  return kb;
}



export function getPremiumKeyboard(
  lang: Language,
  isPremium: boolean,
  tier?: string,
  fullPrice: number = 50
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (!isPremium) {
    kb.text(isUz ? "🎟️ Promokod bormi?" : "🎟️ Have a promo code?", "premium_enter_code").row();
  } else if (tier === "NAWA") {
    kb.text(
      isUz ? `💎 Full Application + NAWA ($${fullPrice}) ga oshirish` : `💎 Upgrade to Full Application + NAWA ($${fullPrice})`,
      "premium_enter_code"
    ).row();
  }

  kb.text(isUz ? "📄 Foydalanish Shartlari & Oferta" : "📄 Terms & Oferta", "menu_oferta").row();

  kb.url(
    isUz ? "💬 Maslahatchi bilan bog'lanish" : "💬 Contact Admissions Consultant",
    "https://t.me/poland_admissions_bot"
  )
    .row()
    .text(t(lang, "nav_main_menu"), "go_main_menu");

  return kb;
}

export function getOfertaKeyboard(lang: Language = "uz"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "✅ Roziman" : "✅ I Agree", "accept_oferta")
    .row()
    .text(t(lang, "nav_main_menu"), "go_main_menu");
}

export function getReviewsKeyboard(
  lang: Language,
  reviews: StudentReview[],
  page: number = 0,
  pageSize: number = 2
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const totalPages = Math.ceil(reviews.length / pageSize) || 1;

  if (page > 0) kb.text(t(lang, "nav_prev"), `revs_page_${page - 1}`);
  if (page < totalPages - 1) kb.text(t(lang, "nav_next"), `revs_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(lang === "uz" ? "✍️ Sharh Qoldirish" : "✍️ Write a Review", "review_write_start")
    .row()
    .text(t(lang, "nav_main_menu"), "go_main_menu");

  return kb;
}

export function getReviewRatingKeyboard(lang: Language): InlineKeyboard {
  return new InlineKeyboard()
    .text("⭐ 1", "rev_rate_1")
    .text("⭐⭐ 2", "rev_rate_2")
    .text("⭐⭐⭐ 3", "rev_rate_3")
    .row()
    .text("⭐⭐⭐⭐ 4", "rev_rate_4")
    .text("⭐⭐⭐⭐⭐ 5", "rev_rate_5")
    .row()
    .text(t(lang, "nav_back"), "menu_reviews");
}
