import assert from "node:assert/strict";
import { db } from "../src/bot/services/db";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin, startAdminSession, endAdminSession } from "../src/bot/services/auth";
import { getAdminPendingDocsKeyboard, getAdminApplicationDetailKeyboard, getAdminNawaListKeyboard, getAdminNawaDetailKeyboard } from "../src/bot/keyboards/adminKeyboards";

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

  // 1. Direct Pending Documents Queue Tests
  test("getPendingDocuments lists individual pending documents directly", () => {
    // Upload documents for student 1 & student 2
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

  // 2. University Applications with Full Documentation Checklist
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

  // 3. NAWA Applications CRM Full Workflow
  test("NAWA Application workflow: submit -> list -> view detail -> stage update -> counselor note", () => {
    const nawaApp = db.createNawaApplication(student2Id, {
      country: "Uzbekistan",
      passportNumber: "FA1234567",
      diplomaLink: "https://drive.google.com/diploma",
      apostilleLink: "https://drive.google.com/apostille",
    });

    assert.ok(nawaApp.id.startsWith("NAWA-"));
    assert.equal(nawaApp.userId, student2Id);
    assert.equal(nawaApp.stage, "Submitted");

    // List NAWA apps
    const allNawa = db.getAllNawaApplications();
    assert.ok(allNawa.length >= 1);
    const fetched = db.getNawaApplication(nawaApp.id);
    assert.equal(fetched?.id, nawaApp.id);

    const userNawa = db.getUserNawaApplications(student2Id);
    assert.equal(userNawa.length, 1);

    // Render NAWA List & Detail keyboards
    const student = db.getUser(student2Id);
    const docDefs = db.getDocumentDefinitions();
    const listKb = getAdminNawaListKeyboard(allNawa, 0, 6, "uz");
    const detailKb = getAdminNawaDetailKeyboard(nawaApp, student.documents || {}, docDefs, "uz");
    assert.ok(listKb.inline_keyboard.length >= 1);
    assert.ok(detailKb.inline_keyboard.length >= 4);

    // Update NAWA Stage
    const updated = db.updateNawaStage(nawaApp.id, "Under Evaluation", "Documents submitted to Kuratorium Oświaty.");
    assert.equal(updated?.stage, "Under Evaluation");
    assert.equal(updated?.counselorNote, "Documents submitted to Kuratorium Oświaty.");
  });

  // 4. Super Admin Access Boundaries & Isolation
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

  console.log("\n🎉 ================= ALL 4/4 NAWA CRM & DIRECT QUEUE TESTS PASSED! =================");
}

runNawaCrmAndQueueTestSuite().catch((err) => {
  console.error("Test suite failed with error:", err);
  process.exit(1);
});
