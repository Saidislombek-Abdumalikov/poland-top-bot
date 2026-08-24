import assert from "node:assert/strict";
import { db } from "../src/bot/services/db";
import { config } from "../src/bot/config";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin, startAdminSession, endAdminSession } from "../src/bot/services/auth";
import { getAdminPendingDocsKeyboard, getAdminApplicationDetailKeyboard, getAdminNawaListKeyboard, getAdminNawaDetailKeyboard } from "../src/bot/keyboards/adminKeyboards";
import { getNawaDocumentsKeyboard } from "../src/bot/keyboards/menuKeyboards";

function test(title: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => console.log(`  ✅ [PASS] ${title}`));
    }
    console.log(`  ✅ [PASS] ${title}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    throw err;
  }
}

async function runNawaCrmAndQueueTestSuite() {
  console.log("\n🏛️ ================= STARTING NAWA CRM & DIRECT QUEUE TEST SUITE =================");

  const superAdminId = 999901;
  const normalAdminId = 999902;
  const student1Id = 999903;
  const student2Id = 999904;

  // Clean setup
  db.resetDatabaseToZero(superAdminId);
  db.clearAuditLogs();

  // Create student users
  db.getUser(student1Id, {
    fullName: "Anvar Karimov",
    phone: "+998901112233",
    preferredLevel: "Bachelor",
    isRegistered: true,
    ofertaAccepted: true,
    isPremium: true,
    premiumTier: "NAWA_FULL",
  });

  db.getUser(student2Id, {
    fullName: "Malika Rahimova",
    phone: "+998904445566",
    preferredLevel: "Master",
    isRegistered: true,
    ofertaAccepted: true,
    isPremium: true,
    premiumTier: "NAWA",
  });

  // 1. Advisor Username Configuration
  test("Advisor username is configured to polandM7 for admissions support", () => {
    assert.equal(config.advisorUsername, "polandM7", "Advisor username must be polandM7");
  });

  // 2. Direct Pending Documents Queue Tests (University Admissions - 7 Docs)
  test("getPendingDocuments lists individual pending documents directly for University admissions", () => {
    db.submitDocument(student1Id, "passport", {
      fileName: "anvar_passport.pdf",
      fileType: "document",
      fileId: "file_p1",
    });

    db.submitDocument(student1Id, "diploma", {
      fileName: "anvar_diploma.pdf",
      fileType: "document",
      fileId: "file_d1",
    });

    db.submitDocument(student2Id, "passport", {
      fileName: "malika_passport.pdf",
      fileType: "document",
      fileId: "file_p2",
    });

    const pending = db.getPendingDocuments();
    assert.equal(pending.length, 3, "Should have exactly 3 pending documents");

    const docDefs = db.getDocumentDefinitions();
    const kb = getAdminPendingDocsKeyboard(pending, 0, 6, "uz", docDefs);
    assert.ok(kb.inline_keyboard.length >= 3, "Keyboard should render pending document rows");

    // Admin verifies 1 document -> pending count drops to 2
    db.verifyDocument(student1Id, "passport", "approved");
    const pendingAfter = db.getPendingDocuments();
    assert.equal(pendingAfter.length, 2, "Pending count should decrease to 2");
    assert.equal(db.getUser(student1Id).documents?.passport.status, "approved");
  });

  // 3. University Applications with Full Documentation Checklist
  test("Applications CRM view displays student profile and full 7-document checklist with statuses", () => {
    const app = db.createApplication(student1Id, "University of Warsaw", "Computer Science (BSc)");
    assert.ok(app.id.startsWith("APP-"));

    const student = db.getUser(student1Id);
    const docDefs = db.getDocumentDefinitions();
    const userDocs = student.documents || {};

    const kb = getAdminApplicationDetailKeyboard(app, userDocs, docDefs, "uz");
    assert.ok(kb.inline_keyboard.length > 5, "Application detail keyboard should have doc inspection buttons and stage controls");

    // Update application stage and counselor note
    const updatedApp = db.updateApplicationStage(app.id, "Accepted", "Congratulations! Full acceptance letter issued.");
    assert.equal(updatedApp?.stage, "Accepted");
    assert.equal(updatedApp?.counselorNote, "Congratulations! Full acceptance letter issued.");
  });

  // 4. Dedicated NAWA 5-Document System (Attestat, Shahodatnoma, Email, Home Address, Passport Red)
  test("NAWA 5 dedicated documents system: submit, checklist keyboard, admin review, and approval", () => {
    // 5 dedicated NAWA document keys
    const nawaDefs = db.getNawaDefinitions();
    const expectedKeys = ["attestat", "shahodatnoma", "email", "home_address", "passport_red"];
    assert.deepEqual(Object.keys(nawaDefs).sort(), expectedKeys.sort(), "NAWA must have 5 dedicated documents");

    // Student 2 submits NAWA documents (Files + Text data)
    db.submitNawaDocument(student2Id, "attestat", {
      fileName: "maktab_attestat.pdf",
      fileType: "document",
      fileId: "nawa_file_attestat",
    });

    db.submitNawaDocument(student2Id, "shahodatnoma", {
      fileName: "shahodatnoma_9sinf.jpg",
      fileType: "photo",
      fileId: "nawa_file_shahodatnoma",
    });

    db.submitNawaDocument(student2Id, "email", {
      value: "malika.student@gmail.com",
    });

    db.submitNawaDocument(student2Id, "home_address", {
      value: "Tashkent, Chilanzar 9, House 15, Apt 22",
    });

    db.submitNawaDocument(student2Id, "passport_red", {
      fileName: "red_passport_scan.pdf",
      fileType: "document",
      fileId: "nawa_file_passport",
    });

    const student2NawaDocs = db.getUserNawaDocuments(student2Id);
    assert.equal(student2NawaDocs.attestat.status, "reviewing");
    assert.equal(student2NawaDocs.shahodatnoma.status, "reviewing");
    assert.equal(student2NawaDocs.email.value, "malika.student@gmail.com");
    assert.equal(student2NawaDocs.home_address.value, "Tashkent, Chilanzar 9, House 15, Apt 22");
    assert.equal(student2NawaDocs.passport_red.status, "reviewing");

    // Student UI Keyboard check
    const studentKb = getNawaDocumentsKeyboard("uz", student2NawaDocs);
    assert.ok(studentKb.inline_keyboard.length >= 6, "Student NAWA dossier keyboard should render 5 docs + nav");

    // NAWA Application sync check
    const userNawaApps = db.getUserNawaApplications(student2Id);
    assert.equal(userNawaApps.length, 1, "Should have 1 NAWA application record");
    const nawaApp = userNawaApps[0];
    assert.equal(nawaApp.documents?.email?.value, "malika.student@gmail.com");

    // Admin UI Detail Keyboard check
    const adminDetailKb = getAdminNawaDetailKeyboard(nawaApp, student2NawaDocs, "uz");
    assert.ok(adminDetailKb.inline_keyboard.length >= 7, "Admin NAWA detail keyboard should render 5 docs + bulk approve + stages");

    // Admin approves individual doc
    db.approveNawaDocument(student2Id, "email", superAdminId);
    assert.equal(db.getUserNawaDocuments(student2Id).email.status, "approved");

    // Admin rejects doc with feedback
    db.rejectNawaDocument(student2Id, "attestat", "Iltimos, attestat ilovasi (baholar) bilan birga qayta yuklang.", superAdminId);
    assert.equal(db.getUserNawaDocuments(student2Id).attestat.status, "needs_correction");
    assert.equal(db.getUserNawaDocuments(student2Id).attestat.counselorFeedback, "Iltimos, attestat ilovasi (baholar) bilan birga qayta yuklang.");

    // Admin bulk approves all NAWA docs
    db.approveAllNawaDocuments(nawaApp.id, superAdminId);
    const approvedDocs = db.getUserNawaDocuments(student2Id);
    assert.equal(approvedDocs.attestat.status, "approved");
    assert.equal(approvedDocs.shahodatnoma.status, "approved");
    assert.equal(approvedDocs.email.status, "approved");
    assert.equal(approvedDocs.home_address.status, "approved");
    assert.equal(approvedDocs.passport_red.status, "approved");

    // Update NAWA Stage
    const updated = db.updateNawaStage(nawaApp.id, "Under Evaluation", "Documents submitted to Kuratorium Oświaty.");
    assert.equal(updated?.stage, "Under Evaluation");
    assert.equal(updated?.counselorNote, "Documents submitted to Kuratorium Oświaty.");
  });

  // 5. Super Admin Access Boundaries & Isolation
  test("Super Admin features are strictly isolated from normal admins and regular students", () => {
    // Normal Admin session
    startAdminSession(normalAdminId, "admin");
    assert.equal(isAuthorizedAdmin(normalAdminId), true, "Normal admin is authorized as admin");
    assert.equal(isAuthorizedSuperAdmin(normalAdminId), false, "Normal admin is NOT super admin");

    // Super Admin session
    startAdminSession(superAdminId, "super_admin");
    assert.equal(isAuthorizedAdmin(superAdminId), true, "Super admin is authorized as admin");
    assert.equal(isAuthorizedSuperAdmin(superAdminId), true, "Super admin is authorized as super admin");

    // Regular student session
    assert.equal(isAuthorizedAdmin(student1Id), false, "Student is NOT admin");
    assert.equal(isAuthorizedSuperAdmin(student1Id), false, "Student is NOT super admin");

    // Cleanup sessions
    endAdminSession(normalAdminId);
    endAdminSession(superAdminId);
    assert.equal(isAuthorizedAdmin(normalAdminId), false);
    assert.equal(isAuthorizedSuperAdmin(superAdminId), false);
  });

  console.log("\n🎉 ================= ALL 5/5 NAWA CRM & DIRECT QUEUE TESTS PASSED! =================");
}

runNawaCrmAndQueueTestSuite().catch((err) => {
  console.error("Test suite failed with error:", err);
  process.exit(1);
});
