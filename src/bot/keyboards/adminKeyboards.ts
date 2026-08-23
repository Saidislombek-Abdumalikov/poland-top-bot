import { InlineKeyboard } from "grammy";
import {
  UserSessionData,
  ApplicationRecord,
  PromoCodeRecord,
  DocumentRecord,
  University,
  DocumentDefinition,
  StudentReview,
  AuditLogEntry,
  Language,
  TransactionRecord,
  PricingConfig,
  OfertaRecord,
} from "../types";

export function getAdminDashboardKeyboard(
  stats: {
    usersCount: number;
    appsCount: number;
    pendingDocsCount: number;
    nawaCount: number;
    reviewsCount?: number;
    adminsCount?: number;
    auditLogsCount?: number;
  },
  lang: Language = "en",
  isSuperAdminUser: boolean = false
): InlineKeyboard {
  const isUz = lang === "uz";

  const kb = new InlineKeyboard();

  if (isSuperAdminUser) {
    kb.text(
      isUz ? `👑 SUPER ADMIN HQ (Master Loglar & Boshqaruv)` : `👑 SUPER ADMIN HQ (Logs & Master Control)`,
      "admin_super_hq"
    ).row();
  }

  kb.text(isUz ? `👥 Talabalar CRM (${stats.usersCount})` : `👥 Users CRM (${stats.usersCount})`, "admin_menu_users")
    .text(isUz ? `📋 Arizalar (${stats.appsCount})` : `📋 Applications (${stats.appsCount})`, "admin_menu_apps")
    .row()
    .text(isUz ? `📁 Hujjatlar (${stats.pendingDocsCount} ta kutilmoqda)` : `📁 Review Queue (${stats.pendingDocsCount})`, "admin_menu_docs")
    .text(isUz ? `🏛️ NAWA Arizalari (${stats.nawaCount})` : `🏛️ NAWA Apps (${stats.nawaCount})`, "admin_menu_nawa")
    .row()
    .text(isUz ? `🏛️ Universitetlar Boshqaruvi` : `🏛️ Manage Universities`, "admin_menu_manage_unis")
    .text(isUz ? `📑 Hujjat Turlari` : `📑 Document Types`, "admin_menu_manage_docdefs")
    .row()
    .text(isUz ? `⭐ Sharhlar (${stats.reviewsCount || 0})` : `⭐ Reviews (${stats.reviewsCount || 0})`, "admin_menu_reviews")
    .text(isUz ? `⚡ Promokodlar` : `⚡ Promo Codes`, "admin_menu_promos")
    .row()
    .text(isUz ? `📢 Global Xabar Yuborish` : `📢 Broadcast Message`, "admin_broadcast_start")
    .row()
    .text(isUz ? `🌐 Til: O'zbekcha 🇺🇿` : `🌐 Lang: English 🇬🇧`, "admin_switch_lang")
    .text(isUz ? `🔄 Yangilash` : `🔄 Refresh Stats`, "admin_refresh")
    .row()
    .text(isUz ? `🏠 Talaba Menyusi` : `🏠 Student Menu`, "go_main_menu");

  return kb;
}

export function getAdminUsersListKeyboard(
  users: UserSessionData[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageUsers = users.slice(start, start + pageSize);

  pageUsers.forEach((u) => {
    const name = u.fullName || u.firstName || `User #${u.userId}`;
    const verifiedCount = Object.values(u.documents || {}).filter((d) => d.status === "approved").length;
    const totalDocs = Object.keys(u.documents || {}).length || 7;
    const tierBadge = u.isPremium ? "💎" : "⚪";

    kb.text(
      `${tierBadge} ${name.slice(0, 18)} (${verifiedCount}/${totalDocs} Docs)`,
      `admin_view_user_${u.userId}`
    ).row();
  });

  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const navRow: { text: string; data: string }[] = [];

  if (page > 0) {
    navRow.push({ text: "⬅️ Prev", data: `admin_users_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navRow.push({ text: "Next ➡️", data: `admin_users_page_${page + 1}` });
  }

  if (navRow.length > 0) {
    navRow.forEach((btn) => kb.text(btn.text, btn.data));
    kb.row();
  }

  kb.text(isUz ? "🔍 Talabani Qidirish" : "🔍 Search Student", "admin_search_user_prompt")
    .text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");

  return kb;
}

export function getAdminUserDetailKeyboard(
  user: UserSessionData,
  lang: Language = "en",
  isSuperAdminUser: boolean = false
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  kb.text(isUz ? "🎁 Bir Martalik VIP Promokod Berish" : "🎁 Assign VIP Single-Use Promo", `admin_assign_promo_${user.userId}`).row();

  // ONLY Super Admin can promote/demote administrators or completely delete user records
  if (isSuperAdminUser && !user.isSuperAdmin) {
    if (user.isAdmin) {
      kb.text(isUz ? "🔴 Admin Huquqini Olish" : "🔴 Demote from Admin", `admin_toggle_admin_${user.userId}`).row();
    } else {
      kb.text(isUz ? "🛡️ Admin Huquqini Berish" : "🛡️ Promote to Admin", `admin_toggle_admin_${user.userId}`).row();
    }
    kb.text(isUz ? "🗑️ Foydalanuvchini Butunlay O'chirish" : "🗑️ Delete User Record", `admin_delete_user_${user.userId}`).row();
  }

  kb.text(isUz ? "◀️ Talabalar Ro'yxatiga" : "◀️ Back to Users", "admin_menu_users");
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
    const stageIcon =
      a.stage === "Accepted"
        ? "✅"
        : a.stage === "University Review"
        ? "🏛️"
        : a.stage === "Processing"
        ? "🟡"
        : a.stage === "Action Needed"
        ? "🔴"
        : "⚪";

    kb.text(
      `${stageIcon} ${a.studentName.slice(0, 14)} - ${a.programName.slice(0, 16)}`,
      `admin_view_app_${a.id}`
    ).row();
  });

  const totalPages = Math.ceil(apps.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_apps_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_apps_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");
  return kb;
}

export function getAdminApplicationDetailKeyboard(app: ApplicationRecord, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "🟡 Holat: Jarayonda" : "🟡 Set: Processing", `admin_set_stage_${app.id}_Processing`)
    .text(isUz ? "🏛️ Holat: Univ Tekshiruvida" : "🏛️ Set: Univ Review", `admin_set_stage_${app.id}_University Review`)
    .row()
    .text(isUz ? "✅ Holat: Qabul Qilindi" : "✅ Set: Accepted", `admin_set_stage_${app.id}_Accepted`)
    .text(isUz ? "🔴 Holat: Tuzatish Kerak" : "🔴 Set: Action Needed", `admin_set_stage_${app.id}_Action Needed`)
    .row()
    .text(isUz ? "💬 Talabaga Maslahatchi Izohi Yuborish" : "💬 Send Feedback Note to Student", `admin_feedback_prompt_${app.id}`)
    .row()
    .text(isUz ? "◀️ Arizalar Ro'yxatiga" : "◀️ Back to Applications", "admin_menu_apps");
}

export function getAdminPendingDocsKeyboard(
  pendingList: { userId: number; user: UserSessionData; doc: DocumentRecord }[],
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (pendingList.length === 0) {
    kb.text(isUz ? "🎉 Tekshirish kutilayotgan hujjatlar yo'q" : "🎉 No pending documents to review", "admin_main").row();
  } else {
    pendingList.forEach((item) => {
      const name = item.user.fullName || item.user.firstName || `User #${item.userId}`;
      const docName = item.doc.name[lang] || item.doc.name.en;
      kb.text(`📄 ${name.slice(0, 14)}: ${docName}`, `admin_review_doc_${item.userId}_${item.doc.id}`).row();
    });
  }

  kb.text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");
  return kb;
}

export function getAdminDocReviewKeyboard(userId: number, docKey: string, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "✅ Tasdiqlash (Qabul)" : "✅ Approve (Verified)", `admin_doc_decision_${userId}_${docKey}_approved`)
    .text(isUz ? "🔴 Rad Etish (Tuzatish)" : "🔴 Reject (Needs Correction)", `admin_doc_decision_${userId}_${docKey}_needs_correction`)
    .row()
    .text(isUz ? "💬 Sabab Izohi Bilan Rad Etish" : "💬 Reject with Custom Reason Note", `admin_doc_reject_note_${userId}_${docKey}`)
    .row()
    .text(isUz ? "◀️ Hujjatlar Navbatiga" : "◀️ Back to Documents", "admin_menu_docs");
}

export function getAdminPromoCodesKeyboard(
  promos: PromoCodeRecord[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pagePromos = promos.slice(start, start + pageSize);

  pagePromos.forEach((p) => {
    const statusIcon = p.isExpired || !p.isActive ? "🔴" : p.usedCount >= p.maxUses ? "🔒" : "🟢";
    const displayTier = p.tier === "NAWA" ? "NAWA" : "Full Application + NAWA";
    kb.text(`${statusIcon} ${p.code} (${displayTier})`, `admin_view_promo_${p.code}`).row();
  });

  const totalPages = Math.ceil(promos.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_promos_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_promos_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "➕ Yangi Promokod Yaratish" : "➕ Generate Promo Code", "admin_create_promo_select")
    .row()
    .text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");

  return kb;
}

export function getAdminPromoProductSelectKeyboard(
  lang: Language = "en",
  pricing?: PricingConfig
): InlineKeyboard {
  const isUz = lang === "uz";
  const nawaPrice = pricing ? pricing.nawaPrice : 15;
  const fullPrice = pricing ? pricing.fullApplicationNawaPrice : 60;
  return new InlineKeyboard()
    .text(
      isUz ? `📦 1. NAWA — $${nawaPrice} (Standart)` : `📦 1. NAWA — $${nawaPrice} (Standard)`,
      "admin_create_promo_tier_NAWA"
    )
    .row()
    .text(
      isUz ? `💎 2. Full Application + NAWA — $${fullPrice} (To'liq Qabul)` : `💎 2. Full Application + NAWA — $${fullPrice} (Full Admissions)`,
      "admin_create_promo_tier_NAWA_FULL"
    )
    .row()
    .text(isUz ? "◀️ Promokodlar Ro'yxatiga" : "◀️ Back to Promo Codes", "admin_menu_promos");
}

export function getAdminPromoDetailKeyboard(promo: PromoCodeRecord, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (promo.isActive && !promo.isExpired) {
    kb.text(isUz ? "🔴 Promokodni To'xtatish" : "🔴 Expire / Deactivate Code", `admin_expire_promo_${promo.code}`).row();
  } else {
    kb.text(isUz ? "🟢 Promokodni Qayta Faollashtirish" : "🟢 Reactivate Code", `admin_reactivate_promo_${promo.code}`).row();
  }

  kb.text(isUz ? "🗑️ Promokodni Butunlay O'chirish" : "🗑️ Delete Promo Code", `admin_delete_promo_${promo.code}`).row();
  kb.text(isUz ? "◀️ Promokodlar Ro'yxatiga" : "◀️ Back to Promo Codes", "admin_menu_promos");
  return kb;
}

// Universities Management Keyboards for Admin
export function getAdminUniversitiesKeyboard(
  unis: University[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageUnis = unis.slice(start, start + pageSize);

  pageUnis.forEach((u) => {
    kb.text(`🏛️ ${u.name.slice(0, 22)} (${u.city})`, `admin_view_uni_${u.id}`).row();
  });

  const totalPages = Math.ceil(unis.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_unis_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_unis_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "➕ Yangi Universitet Qo'shish" : "➕ Add New University", "admin_add_uni_prompt")
    .row()
    .text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");

  return kb;
}

export function getAdminUniversityEditKeyboard(uni: University, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .url(isUz ? "🌐 Rasmiy Veb-Sayt" : "🌐 Official Link", uni.website || "https://studyinpoland.pl")
    .row()
    .text(isUz ? "✏️ Veb-Sayt Havolasini Tahrirlash" : "✏️ Edit Website Link", `admin_edit_uni_web_${uni.id}`)
    .text(isUz ? "✏️ Kontrakt Narxini Tahrirlash" : "✏️ Edit Tuition Info", `admin_edit_uni_tui_${uni.id}`)
    .row()
    .text(isUz ? "🗑️ Universitetni O'chirish" : "🗑️ Delete University", `admin_delete_uni_${uni.id}`)
    .row()
    .text(isUz ? "◀️ Universitetlar Ro'yxatiga" : "◀️ Back to Universities", "admin_menu_manage_unis");
}

// Document Definitions Management Keyboards for Admin
export function getAdminDocDefsKeyboard(
  defs: Record<string, DocumentDefinition>,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  Object.values(defs).forEach((d) => {
    const name = d.name[lang] || d.name.en;
    const reqBadge = d.required ? (isUz ? "⭐ [Majburiy]" : "⭐ [Required]") : (isUz ? "⚪ [Ixtiyoriy]" : "⚪ [Optional]");
    kb.text(`📄 ${name.slice(0, 18)} ${reqBadge}`, `admin_view_docdef_${d.id}`).row();
  });

  kb.text(isUz ? "➕ Yangi Hujjat Talabi Qo'shish" : "➕ Add New Document Requirement", "admin_add_docdef_prompt")
    .row()
    .text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");

  return kb;
}

export function getAdminDocDefEditKeyboard(def: DocumentDefinition, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(
      def.required ? (isUz ? "⭐ Ixtiyoriy Qilish" : "⭐ Make Optional") : (isUz ? "⭐ Majburiy Qilish" : "⭐ Make Required"),
      `admin_toggle_docdef_req_${def.id}`
    )
    .row()
    .text(isUz ? "🗑️ Hujjat Turini O'chirish" : "🗑️ Delete Document Type", `admin_delete_docdef_${def.id}`)
    .row()
    .text(isUz ? "◀️ Hujjat Turlariga Qaytish" : "◀️ Back to Document Types", "admin_menu_manage_docdefs");
}

// Reviews Management Keyboards for Admin
export function getAdminReviewsListKeyboard(
  reviews: StudentReview[],
  page: number = 0,
  pageSize: number = 6,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageRevs = reviews.slice(start, start + pageSize);

  pageRevs.forEach((r) => {
    const statusIcon = r.status === "approved" ? "✅" : (isUz ? "🟡 [Kutilmoqda]" : "🟡 [Pending]");
    kb.text(`${statusIcon} #${r.id} ${r.name.slice(0, 12)} (${r.rating}⭐)`, `admin_view_rev_${r.id}`).row();
  });

  const totalPages = Math.ceil(reviews.length / pageSize) || 1;
  if (page > 0) kb.text("⬅️ Prev", `admin_revs_page_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_revs_page_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "➕ Yangi Sharh / Fikr Qo'shish" : "➕ Add New Review / Testimonial", "admin_add_rev_prompt")
    .row()
    .text(isUz ? "◀️ Admin Bosh Panel" : "◀️ Back to Admin", "admin_main");

  return kb;
}

export function getAdminReviewEditKeyboard(review: StudentReview, lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (review.status === "pending") {
    kb.text(isUz ? "✅ Tasdiqlash & E'lon Qilish" : "✅ Approve & Publish", `admin_rev_decision_${review.id}_approve`)
      .text(isUz ? "🔴 Rad Etish & O'chirish" : "🔴 Reject & Delete", `admin_rev_decision_${review.id}_reject`)
      .row();
  }

  kb.text(isUz ? "✏️ Sharh Matnini Tahrirlash" : "✏️ Edit Review Text", `admin_edit_rev_text_${review.id}`)
    .text(isUz ? "⭐ Bahoni O'zgartirish (1-5)" : "⭐ Change Rating (1-5)", `admin_edit_rev_rating_${review.id}`)
    .row()
    .text(isUz ? "🗑️ Sharhni O'chirish" : "🗑️ Delete Review", `admin_delete_rev_${review.id}`)
    .row()
    .text(isUz ? "◀️ Sharhlar Ro'yxatiga" : "◀️ Back to Reviews", "admin_menu_reviews");

  return kb;
}

// ================= SUPER ADMIN KEYBOARDS =================
export function getSuperAdminDashboardKeyboard(
  stats: {
    adminsCount: number;
    auditLogsCount: number;
    usersCount: number;
  },
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";

  return new InlineKeyboard()
    .text(
      isUz ? `💰 Yashirin Moliyaviy Boshqaruv` : `💰 Private Financial HQ`,
      "admin_super_financial_hq"
    )
    .text(
      isUz ? `📄 Oferta & Narxlar` : `📄 Oferta & Pricing`,
      "admin_menu_oferta_pricing"
    )
    .row()
    .text(
      isUz ? `📜 Barcha Admin Loglari (${stats.auditLogsCount})` : `📜 All Admin Audit Logs (${stats.auditLogsCount})`,
      "admin_super_logs_0"
    )
    .row()
    .text(
      isUz ? `🛡️ Adminlar Boshqaruvi (${stats.adminsCount})` : `🛡️ Manage Admins (${stats.adminsCount})`,
      "admin_super_admins_list"
    )
    .row()
    .text(
      isUz ? `🗄️ Supabase Cloud DB Holati` : `🗄️ Supabase Cloud DB Status`,
      "admin_super_db_status"
    )
    .text(
      isUz ? `🧹 Loglarni Tozalash` : `🧹 Purge Audit Logs`,
      "admin_super_confirm_clear_logs"
    )
    .row()
    .text(isUz ? `◀️ Asosiy Admin Dashboard` : `◀️ Back to Admin Dashboard`, "admin_refresh");
}

export function getSuperAdminFinancialHQKeyboard(lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "📋 Barcha Tranzaksiyalar" : "📋 All Transactions", "admin_super_txns_0")
    .text(isUz ? "🟡 Kutilayotgan To'lovlar" : "🟡 Unverified Queue", "admin_super_txns_unverified_0")
    .row()
    .text(isUz ? "➕ Tashqi To'lovni Kiritish (Manual)" : "➕ Record External Payment", "admin_super_create_txn_prompt")
    .row()
    .text(isUz ? "🗑️ Barcha Tranzaksiyalarni Tozalash" : "🗑️ Purge All Transactions", "admin_super_purge_txns_confirm")
    .row()
    .text(isUz ? "🔄 Yangilash" : "🔄 Refresh", "admin_super_financial_hq")
    .text(isUz ? "◀️ Super Admin HQ" : "◀️ Super Admin HQ", "admin_super_hq");
}

export function getSuperAdminTransactionsKeyboard(
  txns: TransactionRecord[],
  page: number = 0,
  pageSize: number = 5,
  isUnverifiedOnly: boolean = false,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();
  const start = page * pageSize;
  const pageTxns = txns.slice(start, start + pageSize);

  pageTxns.forEach((t) => {
    const icon =
      t.status === "PAID"
        ? "🟢"
        : t.status === "UNVERIFIED"
        ? "🟡"
        : t.status === "REFUNDED"
        ? "🔴"
        : "⚪";
    const prodLabel = t.product === "NAWA" ? "$15 NAWA" : "$50 Full";
    kb.text(`${icon} ${t.id} (${prodLabel} | ${t.status})`, `admin_super_view_txn_${t.id}`).row();
  });

  const totalPages = Math.ceil(txns.length / pageSize) || 1;
  const prefix = isUnverifiedOnly ? "admin_super_txns_unverified_" : "admin_super_txns_";

  if (page > 0) kb.text("⬅️ Prev", `${prefix}${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `${prefix}${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "🔄 Yangilash" : "🔄 Refresh", `${prefix}${page}`)
    .row()
    .text(isUz ? "◀️ Moliyaviy Boshqaruv" : "◀️ Back to Financial HQ", "admin_super_financial_hq");

  return kb;
}

export function getSuperAdminTransactionDetailKeyboard(
  txn: TransactionRecord,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (txn.status === "UNVERIFIED") {
    kb.text(isUz ? "✅ To'lovni Tasdiqlash & Premium Berish" : "✅ Verify Payment & Grant Premium", `admin_super_verify_txn_${txn.id}`).row();
    kb.text(isUz ? "❌ Tranzaksiyani Bekor Qilish" : "❌ Cancel Transaction", `admin_super_cancel_txn_${txn.id}`).row();
  } else if (txn.status === "PAID") {
    kb.text(isUz ? "↩️ To'lovni Qaytarish (Refund)" : "↩️ Refund Payment", `admin_super_refund_txn_${txn.id}`).row();
  }

  kb.text(isUz ? "🗑️ Tranzaksiyani Butunlay O'chirish" : "🗑️ Delete Transaction Record", `admin_super_delete_txn_${txn.id}`).row();
  kb.text(isUz ? "◀️ Tranzaksiyalar Ro'yxatiga" : "◀️ Back to Transactions", "admin_super_txns_0");
  return kb;
}

export function getSuperAdminLogsKeyboard(
  logs: AuditLogEntry[],
  page: number = 0,
  pageSize: number = 5,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();
  const totalPages = Math.ceil(logs.length / pageSize) || 1;

  if (page > 0) kb.text("⬅️ Prev", `admin_super_logs_${page - 1}`);
  if (page < totalPages - 1) kb.text("Next ➡️", `admin_super_logs_${page + 1}`);
  if (page > 0 || page < totalPages - 1) kb.row();

  kb.text(isUz ? "🗑️ Barcha Loglarni Tozalash" : "🗑️ Clear All Logs", "admin_super_clear_logs_confirm")
    .row()
    .text(isUz ? `🔄 Yangilash` : `🔄 Refresh Logs`, `admin_super_logs_${page}`)
    .row()
    .text(isUz ? `◀️ Super Admin HQ` : `◀️ Super Admin HQ`, "admin_super_hq");

  return kb;
}

export function getSuperAdminAdminsKeyboard(
  admins: UserSessionData[],
  currentUserId: number,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  admins.forEach((adm) => {
    if (adm.isSuperAdmin || adm.adminRole === "super_admin" || adm.userId === currentUserId) return; // Hide Super Admin from list to maintain stealth
    const name = adm.fullName || adm.firstName || (adm.username ? `@${adm.username}` : `User #${adm.userId}`);
    kb.text(`❌ [Bo'shatish]`, `admin_super_demote_${adm.userId}`)
      .text(`🗑️ [O'chirish]`, `admin_super_delete_admin_${adm.userId}`)
      .row();
  });

  kb.text(isUz ? "➕ Yangi Admin Tayinlash (ID/User orqali)" : "➕ Appoint New Admin", "admin_super_appoint_prompt")
    .row()
    .text(isUz ? "◀️ Super Admin HQ" : "◀️ Super Admin HQ", "admin_super_hq");

  return kb;
}

export function getSuperAdminDbStatusKeyboard(lang: Language = "en"): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "🔄 Cloud Syncni Majburiy Qilish" : "🔄 Force Cloud Sync Now", "admin_super_force_sync")
    .row()
    .text(isUz ? "⚠️ Barcha Test Ma'lumotlarni 0 ga Qaytarish (Wipe)" : "⚠️ Wipe & Reset Database to 0", "admin_super_reset_db_confirm")
    .row()
    .text(isUz ? "◀️ Super Admin HQ" : "◀️ Super Admin HQ", "admin_super_hq");
}

export function getAdminOfertaPricingKeyboard(
  pricing: PricingConfig,
  oferta: OfertaRecord,
  hasDraft: boolean,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  kb.text(
    isUz ? `💵 NAWA Narxi ($${pricing.nawaPrice})` : `💵 NAWA Price ($${pricing.nawaPrice})`,
    "admin_edit_price_nawa"
  )
    .text(
      isUz ? `💎 Full App + NAWA ($${pricing.fullApplicationNawaPrice})` : `💎 Full App + NAWA ($${pricing.fullApplicationNawaPrice})`,
      "admin_edit_price_full"
    )
    .row()
    .text(
      isUz ? `💶 Ariza To'lovi (€${pricing.applicationFee})` : `💶 App Fee (€${pricing.applicationFee})`,
      "admin_edit_fee"
    )
    .text(
      isUz ? `✏️ Oferta Matnini Tahrirlash` : `✏️ Edit Oferta Text`,
      "admin_edit_oferta_text"
    )
    .row()
    .text(
      isUz ? `👁️ Ofertani Ko'rish (Preview)` : `👁️ Preview Oferta`,
      "admin_preview_oferta"
    );

  if (hasDraft) {
    kb.text(
      isUz ? `🚀 Ofertani E'lon Qilish (Publish)` : `🚀 Publish New Oferta`,
      "admin_publish_oferta_confirm"
    );
  }

  kb.row().text(isUz ? `◀️ Super Admin HQ` : `◀️ Back to Super Admin HQ`, "admin_super_hq");

  return kb;
}

export function getAdminOfertaPreviewKeyboard(
  hasDraft: boolean,
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  const kb = new InlineKeyboard();

  if (hasDraft) {
    kb.text(
      isUz ? `🚀 Tasdiqlash & E'lon Qilish (Publish)` : `🚀 Confirm & Publish`,
      "admin_publish_oferta_execute"
    ).row();
  }

  kb.text(
    isUz ? `◀️ Oferta & Narxlar Paneliga` : `◀️ Back to Oferta & Pricing`,
    "admin_menu_oferta_pricing"
  );

  return kb;
}

export function getSuperAdminPurgeTransactionsConfirmKeyboard(
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "🚨 Ha, barcha tranzaksiyalarni o'chirish" : "🚨 Yes, purge all transactions", "admin_super_purge_txns_execute")
    .row()
    .text(isUz ? "❌ Bekor qilish" : "❌ Cancel", "admin_super_financial_hq");
}

export function getSuperAdminClearLogsConfirmKeyboard(
  lang: Language = "en"
): InlineKeyboard {
  const isUz = lang === "uz";
  return new InlineKeyboard()
    .text(isUz ? "🚨 Ha, barcha loglarni tozalash" : "🚨 Yes, clear all logs", "admin_super_clear_logs_execute")
    .row()
    .text(isUz ? "❌ Bekor qilish" : "❌ Cancel", "admin_super_hq");
}
