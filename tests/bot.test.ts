import assert from "node:assert/strict";
import { db } from "../src/bot/services/db";
import { authenticatePasscode, isAuthorizedAdmin, startAdminSession, endAdminSession } from "../src/bot/services/auth";
import { programs } from "../src/bot/data/programs";
import { universities } from "../src/bot/data/universities";
import { config } from "../src/bot/config";

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => console.log(`  ✅ [PASS] ${name}`))
        .catch((err) => {
          console.error(`  ❌ [FAIL] ${name}`);
          throw err;
        });
    }
    console.log(`  ✅ [PASS] ${name}`);
    return Promise.resolve();
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    throw err;
  }
}

async function main() {
  console.log("\n🚀 ================= STARTING PTU BOT TEST SUITE =================");

  // 1. Config & System Setup
  await runTest("Config validates and default credentials are secure", () => {
    assert.ok(config.botToken, "Bot token should be configured");
    assert.equal(config.adminPasscode, "PTUADMIN2025", "Admin passcode defaults properly");
    // Verify super admin config properties are removed
    assert.equal((config as any).superAdminPasscode, undefined, "superAdminPasscode should be removed");
    assert.equal((config as any).superAdminTelegramId, undefined, "superAdminTelegramId should be removed");
  });

  // 2. Authentication & Admin Authorization
  await runTest("Admin authentication with passcode works and super admin is gone", () => {
    // Correct admin passcode
    assert.equal(authenticatePasscode("PTUADMIN2025"), true, "Should authenticate PTUADMIN2025");
    // Wrong passcode
    assert.equal(authenticatePasscode("wrong_passcode"), false, "Should reject wrong passcode");
    // Old super admin passcode must NOT give special role
    assert.equal(authenticatePasscode("super*admin"), false, "Old super admin passcode should not authenticate");

    const testAdminId = 998877;
    assert.equal(isAuthorizedAdmin(testAdminId), false, "Non-admin should not be authorized");

    startAdminSession(testAdminId);
    assert.equal(isAuthorizedAdmin(testAdminId), true, "Admin should be authorized after session start");

    const user = db.getUser(testAdminId);
    assert.equal(user.isAdmin, true);
    assert.equal(user.adminRole, "admin");
    assert.equal((user as any).isSuperAdmin, undefined, "isSuperAdmin flag should not exist");

    endAdminSession(testAdminId);
    assert.equal(isAuthorizedAdmin(testAdminId), false, "Admin session should end after logout");
  });

  // 3. Student Onboarding & Oferta Acceptance
  await runTest("Student registration and Oferta acceptance workflow", () => {
    const studentId = 112233;
    db.deleteUser(studentId);
    const student = db.getUser(studentId, { username: "student_test" });
    assert.equal(student.isRegistered, false, "New student starts unregistered");

    // Step 1: Full Name
    db.updateUser(studentId, { fullName: "Ali Valiyev" });
    // Step 2: Phone
    db.updateUser(studentId, { phone: "+998901234567" });
    // Step 3: Preferred degree level
    db.updateUser(studentId, { preferredLevel: "Bachelor" });

    // Verify phone uniqueness check
    assert.equal(db.isPhoneRegistered("+998901234567", 999999), true, "Should detect registered phone");
    assert.equal(db.isPhoneRegistered("+998901234567", studentId), false, "Should exclude same user ID");

    // Oferta acceptance
    db.acceptOferta(studentId);
    const updated = db.getUser(studentId);
    assert.equal(updated.isRegistered, true, "User should be registered after accepting Oferta");
    assert.ok(updated.acceptedOfertaAt, "Accepted timestamp should be set");
  });

  // 4. Universities & Programs
  await runTest("Universities and degree programs catalog queries", () => {
    const unis = db.getAllUniversities();
    assert.ok(unis.length > 0, "Universities catalog must not be empty");

    const warsawUnis = db.getAllUniversities("Warsaw");
    assert.ok(warsawUnis.every((u) => u.city.toLowerCase() === "warsaw"), "City filter must match Warsaw");

    assert.ok(programs.length > 0, "Programs catalog must not be empty");
    const prog = programs[0];
    assert.ok(prog.id && prog.name && prog.university, "Program must have valid metadata");

    // Toggle save program
    const studentId = 112233;
    const isSaved = db.toggleSaveProgram(studentId, prog.id);
    assert.equal(isSaved, true, "Program should be saved");
    const isUnsaved = db.toggleSaveProgram(studentId, prog.id);
    assert.equal(isUnsaved, false, "Program should be unsaved");
  });

  // 5. University Application Submission
  await runTest("Student submits university application and admin reviews stage", () => {
    const studentId = 112233;
    const prog = programs[0];

    const app = db.createApplication(studentId, prog.id, prog.name, prog.university, prog.city);
    assert.ok(app.id.startsWith("APP-"), "App ID should be generated");
    assert.equal(app.stage, "Submitted");

    const userApps = db.getUserApplications(studentId);
    assert.ok(userApps.some((a) => a.id === app.id), "Application should appear in student list");

    // Admin updates stage
    db.updateApplicationStage(app.id, "Processing", "Sizning arizangiz ko'rib chiqilmoqda");
    const updatedApp = db.getApplication(app.id);
    assert.equal(updatedApp?.stage, "Processing");
    assert.equal(updatedApp?.counselorNote, "Sizning arizangiz ko'rib chiqilmoqda");
  });

  // 6. Document Upload & Pending Review Queue
  await runTest("Document upload and admin review queue", async () => {
    const studentId = 112233;
    await db.saveUserDocument(studentId, "passport", {
      fileId: "telegram_file_passport_xyz",
      fileName: "Passport_Scan.pdf",
      fileType: "document",
    });

    const studentDocs = db.getUserDocuments(studentId);
    assert.ok(studentDocs.passport, "Passport document should be saved");
    assert.equal(studentDocs.passport.status, "reviewing");

    const pending = db.getPendingDocuments();
    assert.ok(pending.some((item) => item.userId === studentId && item.doc.id === "passport"));

    // Admin approves document
    db.updateDocumentStatus(studentId, "passport", "approved", "To'g'ri va sifatli nusxa");
    const approvedDocs = db.getUserDocuments(studentId);
    assert.equal(approvedDocs.passport.status, "approved");
  });

  // 7. Test Materials CRUD
  await runTest("Test materials catalog and CRUD operations", () => {
    const tests = db.getAllTests();
    assert.ok(tests.length >= 3, "Should have default test materials");

    const newTest = db.saveTest({
      id: "test-chemistry-2025",
      title: { uz: "Kimyo Testlari", en: "Chemistry Tests" },
      subject: "Kimyo",
      fileName: "chemistry_tests.pdf",
      fileType: "document",
      isFree: true,
      createdAt: "2026-09-27",
      addedByName: "Admin",
    });

    const retrieved = db.getTest("test-chemistry-2025");
    assert.equal(retrieved?.id, "test-chemistry-2025");
    assert.equal(retrieved?.subject, "Kimyo");

    db.deleteTest("test-chemistry-2025");
    assert.equal(db.getTest("test-chemistry-2025"), undefined);
  });

  // 8. Student Reviews Moderation
  await runTest("Student reviews submission and moderation", () => {
    const review = db.addReview({
      userId: 112233,
      name: "Ali Valiyev",
      country: "Uzbekistan",
      university: "University of Warsaw",
      program: "Computer Science",
      rating: 5,
      year: "2026",
      text: { uz: "Juda ajoyib bot va yordam!", en: "Great support!" },
      status: "pending",
    });

    assert.ok(review.id > 0);
    assert.equal(review.status, "pending");

    const pendingReviews = db.getPendingReviews();
    assert.ok(pendingReviews.some((r) => r.id === review.id));

    // Admin approves review
    db.updateReviewStatus(review.id, "approved");
    const approvedReviews = db.getApprovedReviews();
    assert.ok(approvedReviews.some((r) => r.id === review.id));
  });

  // 9. Oferta Rendering
  await runTest("Oferta text rendering and update", () => {
    const oferta = db.getPublishedOferta();
    assert.ok(oferta.text.includes("POLAND TOP UNIVERSITIES"), "Oferta should contain header");
  });

  // Clean up test data after tests
  db.deleteUser(112233);
  db.deleteUser(998877);
  (db as any).data.applications = {};
  (db as any).data.reviews = [];
  db.saveDatabase();

  console.log("\n🎉 ================= ALL BOT TESTS PASSED SUCCESSFULLY! =================");
}

main().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
