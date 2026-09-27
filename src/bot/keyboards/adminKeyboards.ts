import { InlineKeyboard } from "grammy";
import {
  UserSessionData,
  ApplicationRecord,
  DocumentRecord,
  University,
  DocumentDefinition,
  StudentReview,
  Language,
  TestMaterial,
} from "../types";

export function getAdminDashboardKeyboard(
  stats: {
    usersCount: number;
    appsCount: number;
    pendingDocsCount: number;
    reviewsCount?: number;
    testsCount?: number;
  },
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(
      isUz ? `📋 Arizalar (${stats.appsCount})` : `📋 Applications (${stats.appsCount})`,
      "admin_menu_apps"
    )
    .text(
      isUz ? `📁 Hujjatlar Navbati (${stats.pendingDocsCount})` : `📁 Doc Queue (${stats.pendingDocsCount})`,
      "admin_menu_docs"
    )
    .row()
    .text(
      isUz ? `👥 Talabalar CRM (${stats.usersCount})` : `👥 Students CRM (${stats.usersCount})`,
      "admin_menu_users"
    )
    .text(isUz ? `🏛️ Universitetlar` : `🏛️ Universities`, "admin_menu_manage_unis")
    .row()
    .text(isUz ? `📑 Hujjat Turlari` : `📑 Doc Types`, "admin_menu_manage_docdefs")
    .text(
      isUz ? `⭐ Sharhlar (${stats.reviewsCount || 0})` : `⭐ Reviews (${stats.reviewsCount || 0})`,
      "admin_menu_reviews"
    )
    .row()
    .text(
      isUz ? `📝 Testlar (${stats.testsCount || 0})` : `📝 Tests (${stats.testsCount || 0})`,
      "admin_menu_tests"
    )
    .text(isUz ? `📄 Ommaviy Oferta` : `📄 Terms / Oferta`, "admin_preview_oferta")
    .row()
    .text(isUz ? `📢 Global Xabar` : `📢 Broadcast`, "admin_broadcast_start")
    .text(isUz ? `🚪 Chiqish` : `🚪 Logout`, "admin_logout");
}

export function getAdminUsersListKeyboard(
  users: UserSessionData[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  kb.text(isUz ? "🔍 Talabani Qidirish" : "🔍 Search Student", "admin_search_user_prompt").row();

  const start = page * pageSize;
  const pageUsers = users.slice(start, start + pageSize);

  pageUsers.forEach((u) => {
    const name = u.fullName || u.firstName || `User #${u.userId}`;
    const username = u.username ? ` (@${u.username})` : "";
    kb.text(`👤 ${name}${username}`, `admin_view_user_${u.userId}`).row();
  });

  const totalPages = Math.ceil(users.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_users_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_users_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Admin Dashboard", "admin_main");
  return kb;
}

export function getAdminUserDetailKeyboard(targetUser: UserSessionData, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  kb.text(
    isUz ? "📁 Talaba Hujjatlarini Ko'rish" : "📁 View Student Dossier",
    `admin_review_student_docs_${targetUser.userId}`
  ).row();

  kb.text(
    isUz ? "🗑️ Talabani O'chirish" : "🗑️ Delete Student",
    `admin_delete_user_${targetUser.userId}`
  ).row();

  kb.text(isUz ? "◀️ Talabalar Ro'yxatiga" : "◀️ Back to Students", "admin_menu_users")
    .text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Dashboard", "admin_main");

  return kb;
}

export function getAdminApplicationsListKeyboard(
  apps: ApplicationRecord[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  const start = page * pageSize;
  const pageApps = apps.slice(start, start + pageSize);

  pageApps.forEach((a) => {
    const icon =
      a.stage === "Accepted"
        ? "✅"
        : a.stage === "University Review"
        ? "🏛️"
        : a.stage === "Processing"
        ? "🟡"
        : a.stage === "Action Needed"
        ? "🔴"
        : "⚪";
    kb.text(`${icon} ${a.studentName} — ${a.university}`, `admin_view_app_${a.id}`).row();
  });

  const totalPages = Math.ceil(apps.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_apps_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_apps_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Dashboard", "admin_main");
  return kb;
}

export function getAdminApplicationDetailKeyboard(app: ApplicationRecord, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  kb.text(
    isUz ? "📁 Talabaning Barcha Hujjatlari" : "📁 View Student Dossier",
    `admin_review_student_docs_${app.userId}`
  ).row();

  // Stage changes
  kb.text(app.stage === "Processing" ? "🔘 Processing" : "🟡 Set Processing", `admin_set_stage_Processing_${app.id}`)
    .text(
      app.stage === "University Review" ? "🔘 Uni Review" : "🏛️ Set Uni Review",
      `admin_set_stage_UniversityReview_${app.id}`
    )
    .row()
    .text(app.stage === "Accepted" ? "🔘 Accepted" : "✅ Set Accepted", `admin_set_stage_Accepted_${app.id}`)
    .text(app.stage === "Action Needed" ? "🔘 Action Needed" : "🔴 Set Action Needed", `admin_set_stage_ActionNeeded_${app.id}`)
    .row();

  kb.text(isUz ? "💬 Izoh / Xabar Yozish" : "💬 Add Counselor Note", `admin_feedback_prompt_${app.id}`).row();

  kb.text(isUz ? "◀️ Arizalarga Qaytish" : "◀️ Back to Apps", "admin_menu_apps")
    .text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Dashboard", "admin_main");

  return kb;
}

export function getAdminPendingDocsKeyboard(
  pendingDocs: { userId: number; user: UserSessionData; doc: DocumentRecord }[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  // Group by student
  const studentMap: Map<number, { user: UserSessionData; count: number }> = new Map();
  pendingDocs.forEach((item) => {
    const current = studentMap.get(item.userId);
    if (!current) {
      studentMap.set(item.userId, { user: item.user, count: 1 });
    } else {
      current.count += 1;
    }
  });

  const studentList = Array.from(studentMap.entries());
  const start = page * pageSize;
  const pageItems = studentList.slice(start, start + pageSize);

  pageItems.forEach(([studentId, info]) => {
    const studentName = info.user.fullName || info.user.firstName || `Student #${studentId}`;
    const label = `📁 ${studentName} (${info.count} ta kutilmoqda)`;
    kb.text(label, `admin_review_student_docs_${studentId}`).row();
  });

  const totalPages = Math.ceil(studentList.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_queue_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_queue_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "🔄 Yangilash" : "🔄 Refresh", "admin_menu_docs")
    .text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Dashboard", "admin_main");

  return kb;
}

export function getAdminStudentDossierKeyboard(
  student: UserSessionData,
  docDefs: Record<string, DocumentDefinition>,
  hasPending: boolean,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (hasPending) {
    kb.text(
      isUz ? "⚡ Barchasini Tasdiqlash (1-bosishda)" : "⚡ Approve All Documents",
      `admin_approve_all_student_docs_${student.userId}`
    ).row();
  }

  const docs = student.documents || {};
  Object.keys(docDefs).forEach((docKey) => {
    const def = docDefs[docKey];
    const doc = docs[docKey];
    const status = doc?.status || "missing";
    const statusIcon =
      status === "approved" ? "✅" : status === "reviewing" ? "🟡" : status === "needs_correction" ? "🔴" : "⚪";
    const title = def.name[lang] || def.name.en || docKey;
    kb.text(`${statusIcon} ${title}`, `admin_review_doc_${student.userId}_${docKey}`).row();
  });

  kb.text(isUz ? "◀️ Navbatga Qaytish" : "◀️ Back to Queue", "admin_menu_docs")
    .text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Dashboard", "admin_main");

  return kb;
}

export function getAdminDocReviewKeyboard(
  studentId: number,
  docKey: string,
  docStatus: string,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (docStatus !== "approved") {
    kb.text(isUz ? "✅ Tasdiqlash" : "✅ Approve", `admin_doc_decision_${studentId}_${docKey}_approved`);
  }

  kb.text(
    isUz ? "🔴 Tuzatish So'rash (Izoh bilan)" : "🔴 Request Correction",
    `admin_doc_reject_note_${studentId}_${docKey}`
  ).row();

  kb.text(isUz ? "◀️ Talaba Dosyesi" : "◀️ Student Dossier", `admin_review_student_docs_${studentId}`)
    .text(isUz ? "📁 Hujjatlar Navbati" : "📁 Queue", "admin_menu_docs");

  return kb;
}

export function getAdminUniversitiesKeyboard(unis: University[], page: number = 0, pageSize: number = 6): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text("➕ Add University", "admin_add_uni_prompt").row();

  const start = page * pageSize;
  const pageUnis = unis.slice(start, start + pageSize);

  pageUnis.forEach((u) => {
    kb.text(`🏛️ ${u.name} (${u.city})`, `admin_view_uni_${u.id}`).row();
  });

  const totalPages = Math.ceil(unis.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_unis_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_unis_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text("🎛️ Admin Dashboard", "admin_main");
  return kb;
}

export function getAdminUniversityEditKeyboard(uniId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("🌐 Edit Website", `admin_edit_uni_web_${uniId}`)
    .text("💰 Edit Tuition", `admin_edit_uni_tui_${uniId}`)
    .row()
    .text("🗑️ Delete University", `admin_delete_uni_${uniId}`)
    .row()
    .text("◀️ Back to Universities", "admin_menu_manage_unis")
    .text("🎛️ Dashboard", "admin_main");
}

export function getAdminDocDefsKeyboard(defs: Record<string, DocumentDefinition>): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text("➕ Add Document Type", "admin_add_docdef_prompt").row();

  Object.values(defs).forEach((d) => {
    const req = d.required ? "🔴 Required" : "⚪ Optional";
    kb.text(`📄 ${d.name.uz || d.name.en} (${req})`, `admin_view_docdef_${d.id}`).row();
  });

  kb.text("🎛️ Admin Dashboard", "admin_main");
  return kb;
}

export function getAdminDocDefEditKeyboard(docKey: string, required: boolean): InlineKeyboard {
  return new InlineKeyboard()
    .text(required ? "Make Optional" : "Make Required", `admin_toggle_docdef_req_${docKey}`)
    .row()
    .text("🗑️ Delete Document Type", `admin_delete_docdef_${docKey}`)
    .row()
    .text("◀️ Back to Types", "admin_menu_manage_docdefs")
    .text("🎛️ Dashboard", "admin_main");
}

export function getAdminReviewsListKeyboard(reviews: StudentReview[], page: number = 0, pageSize: number = 6): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text("➕ Add Review", "admin_add_rev_prompt").row();

  const start = page * pageSize;
  const pageRevs = reviews.slice(start, start + pageSize);

  pageRevs.forEach((r) => {
    const status = r.status === "approved" ? "✅" : "🟡";
    kb.text(`${status} ⭐${r.rating} ${r.name} (${r.university})`, `admin_view_rev_${r.id}`).row();
  });

  const totalPages = Math.ceil(reviews.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_revs_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_revs_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text("🎛️ Admin Dashboard", "admin_main");
  return kb;
}

export function getAdminReviewEditKeyboard(review: StudentReview): InlineKeyboard {
  const kb = new InlineKeyboard();

  if (review.status === "pending") {
    kb.text("✅ Approve Review", `admin_rev_decision_${review.id}_approve`).row();
  } else {
    kb.text("🟡 Mark Pending", `admin_rev_decision_${review.id}_reject`).row();
  }

  kb.text("✏️ Edit Text", `admin_edit_rev_text_${review.id}`)
    .text("⭐ Change Rating", `admin_edit_rev_rating_${review.id}`)
    .row()
    .text("🗑️ Delete Review", `admin_delete_rev_${review.id}`)
    .row()
    .text("◀️ Back to Reviews", "admin_menu_reviews")
    .text("🎛️ Dashboard", "admin_main");

  return kb;
}

export function getAdminTestsListKeyboard(tests: TestMaterial[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text("➕ Yangi Test Qo'shish", "admin_add_test").row();

  tests.forEach((t) => {
    kb.text(`📄 ${t.title.uz || t.title.en}`, `admin_view_test_${t.id}`).row();
  });

  kb.text("🎛️ Boshqaruv Paneli", "admin_main");
  return kb;
}

export function getAdminTestDetailKeyboard(test: TestMaterial): InlineKeyboard {
  return new InlineKeyboard()
    .text("✏️ Sarlavhani Tahrirlash", `admin_edit_test_title_${test.id}`)
    .text("📚 Fanni Tahrirlash", `admin_edit_test_subject_${test.id}`)
    .row()
    .text("📎 Faylni Yangilash", `admin_edit_test_file_${test.id}`)
    .row()
    .text("🗑️ Testni O'chirish", `admin_del_test_confirm_${test.id}`)
    .row()
    .text("◀️ Testlar Ro'yxatiga", "admin_menu_tests")
    .text("🎛️ Boshqaruv Paneli", "admin_main");
}

export function getAdminDeleteTestConfirmKeyboard(testId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("⚠️ Ha, O'chirilsin", `admin_del_test_execute_${testId}`)
    .text("❌ Bekor Qilish", `admin_view_test_${testId}`);
}

export function getAdminOfertaPreviewKeyboard(isUz: boolean = true): InlineKeyboard {
  return new InlineKeyboard()
    .text(isUz ? "✏️ Matnni Tahrirlash" : "✏️ Edit Oferta Text", "admin_edit_oferta_text")
    .row()
    .text(isUz ? "🎛️ Boshqaruv Paneli" : "🎛️ Dashboard", "admin_main");
}
