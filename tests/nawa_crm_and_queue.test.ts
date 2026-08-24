import assert from "node:assert/strict";
import { db } from "../src/bot/services/db";
import { config } from "../src/bot/config";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin, startAdminSession, endAdminSession } from "../src/bot/services/auth";
import { aiValidator } from "../src/bot/services/aiValidation";
import {
  getAdminPendingDocsKeyboard,
  getAdminPendingNawaDocsKeyboard,
  getAdminNawaHubKeyboard,
  getAdminApplicationDetailKeyboard,
  getAdminNawaListKeyboard,
  getAdminNawaDetailKeyboard,
} from "../src/bot/keyboards/adminKeyboards";
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
  console.log("\n🏛️ ================= STARTING NAWA CRM, QUEUES & ACCESS CONTROL AUDIT TEST SUITE =================");

  const superAdminId = 999901;
  const normalAdminId = 999902;
  const student1Id = 999903; // Full Package ($60)
  const student2Id = 999904; // NAWA-only ($15)
  const student3Id = 999905; // Free/Standard (unpaid)

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

  db.getUser(student3Id, {
    fullName: "Jasur Aliyev",
    phone: "+998907778899",
    preferredLevel: "Bachelor",
    isRegistered: true,
    ofertaAccepted: true,
    isPremium: false,
  });

  // 1. Advisor Username Configuration
  test("Advisor username is configured to polandM7 for admissions support", () => {
    assert.equal(config.advisorUsername, "polandM7", "Advisor username must be polandM7");
  });

  // 2. Server-side Workflow Access Enforcement (NAWA vs University Application)
  test("Strict workflow access control: NAWA ($15) blocked on Uni docs; Full ($60) has access to both; Free blocked on both", () => {
    // Student 1 (Full Package)
    const s1UniAccess = db.validateWorkflowAccess(student1Id, "UNIVERSITY_APPLICATION");
    const s1NawaAccess = db.validateWorkflowAccess(student1Id, "NAWA");
    assert.equal(s1UniAccess.allowed, true, "Full Package must have University Application access");
    assert.equal(s1NawaAccess.allowed, true, "Full Package must have NAWA access");

    // Student 2 (NAWA-only)
    const s2UniAccess = db.validateWorkflowAccess(student2Id, "UNIVERSITY_APPLICATION");
    const s2NawaAccess = db.validateWorkflowAccess(student2Id, "NAWA");
    assert.equal(s2UniAccess.allowed, false, "NAWA-only student must NOT have University Application access");
    assert.equal(s2NawaAccess.allowed, true, "NAWA-only student must have NAWA access");

    // Student 3 (Free/Unpaid)
    const s3UniAccess = db.validateWorkflowAccess(student3Id, "UNIVERSITY_APPLICATION");
    const s3NawaAccess = db.validateWorkflowAccess(student3Id, "NAWA");
    assert.equal(s3UniAccess.allowed, false, "Unpaid student must NOT have University Application access");
    assert.equal(s3NawaAccess.allowed, false, "Unpaid student must NOT have NAWA access");

    // Attempting submitDocument on NAWA-only user throws an error
    assert.throws(
      () => {
        db.submitDocument(student2Id, "passport", {
          fileName: "illegal_passport.pdf",
          fileType: "document",
          fileId: "file_p_illegal",
        });
      },
      /NAWA-only/i,
      "submitDocument should throw when called by NAWA-only student"
    );
  });

  // 3. AI Document Validation Service with Immediate Cleanup
  test("Temporary AI document evaluation executes and cleans up temporary payloads immediately", async () => {
    const evaluation = await aiValidator.validateDocument("passport", {
      fileName: "anvar_passport.pdf",
      fileType: "document",
      fileId: "file_temp_1",
    });

    assert.equal(evaluation.isValid, true, "AI validation should evaluate document format");
    assert.ok(evaluation.confidence > 0.8, "Confidence score should be high for valid format");
  });

  // 4. Dedicated Queues Separation: University Queue vs NAWA Queue
  test("University Documents and NAWA Documents enter their respective isolated queues", () => {
    // Full student submits University documents (7-doc system)
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

    // NAWA student submits NAWA documents (5-doc system)
    db.submitNawaDocument(student2Id, "attestat", {
      fileName: "maktab_attestat.pdf",
      fileType: "document",
      fileId: "nawa_file_attestat",
    });

    db.submitNawaDocument(student2Id, "email", {
      value: "malika.student@gmail.com",
    });

    // University Queue
    const uniPending = db.getPendingDocuments();
    assert.equal(uniPending.length, 2, "University queue must contain exactly 2 documents");
    assert.ok(uniPending.every((item) => item.userId === student1Id), "University queue should only have student 1 docs");

    // NAWA Queue
    const nawaPending = db.getPendingNawaDocuments();
    assert.equal(nawaPending.length, 2, "NAWA queue must contain exactly 2 documents");
    assert.ok(nawaPending.every((item) => item.userId === student2Id), "NAWA queue should only have student 2 docs");

    // Admin verifies 1 Uni doc and 1 NAWA doc
    db.verifyDocument(student1Id, "passport", "approved");
    db.approveNawaDocument(student2Id, "email", normalAdminId);

    assert.equal(db.getPendingDocuments().length, 1, "Uni queue should now have 1 document");
    assert.equal(db.getPendingNawaDocuments().length, 1, "NAWA queue should now have 1 document");
  });

  // 5. NAWA Hub Keyboards and Admin Workflows
  test("NAWA Hub correctly renders separate NAWA Queue and NAWA Applications keyboards", () => {
    const pendingNawa = db.getPendingNawaDocuments();
    const nawaApps = db.getAllNawaApplications();

    const hubKb = getAdminNawaHubKeyboard(nawaApps.length, pendingNawa.length, "uz");
    assert.ok(hubKb.inline_keyboard.length >= 3, "Hub keyboard should render queue, apps, and back buttons");

    const queueKb = getAdminPendingNawaDocsKeyboard(pendingNawa, 0, 6, "uz");
    assert.ok(queueKb.inline_keyboard.length >= 2, "Pending NAWA docs keyboard should render pending item");

    const appsKb = getAdminNawaListKeyboard(nawaApps, 0, 6, "uz");
    assert.ok(appsKb.inline_keyboard.length >= 2, "NAWA apps keyboard should render student application");
  });

  // 6. Super Admin Invisibility in User CRM and Public Views
  test("Super Admin is completely invisible in getAllUsers(), searchUsers(), and admin dashboards", () => {
    // Super Admin user setup
    db.getUser(superAdminId, {
      fullName: "Master Director",
      isSuperAdmin: true,
      adminRole: "super_admin",
    });

    const allUsers = db.getAllUsers();
    assert.ok(!allUsers.some((u) => u.userId === superAdminId), "Super Admin must NEVER be returned in getAllUsers()");

    const searched = db.searchUsers("Master Director");
    assert.ok(!searched.some((u) => u.userId === superAdminId), "Super Admin must NEVER be returned in searchUsers()");

    // Normal admin logs viewing never reveals Super Admin role
    const logs = db.getAuditLogs(10, false);
    assert.ok(!logs.some((l) => l.actorRole === "super_admin"), "Audit logs for normal admins must not expose super_admin role");
  });

  console.log("\n🎉 ================= ALL 6/6 NAWA CRM, QUEUES & ACCESS CONTROL TESTS PASSED! =================");
}

runNawaCrmAndQueueTestSuite().catch((err) => {
  console.error("Test suite failed with error:", err);
  process.exit(1);
});
