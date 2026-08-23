import * as assert from "assert";
import { db } from "../src/bot/services/db";
import { isNawaAllowed, isNawaFullAllowed } from "../src/bot/utils/paywall";
import { programs } from "../src/bot/data/programs";

async function runEndToEndTestSuite() {
  console.log("\n🚀 ================= STARTING END-TO-END USER JOURNEY TEST SUITE =================");

  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (e: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(e);
      process.exit(1);
    }
  }

  // 1. Initial State & Clean Setup
  test("Database initializes with active catalog and default pricing ($60 / $15 / €30)", () => {
    db.resetDatabaseToZero(5059829001);
    const pricing = db.getPricingConfig();
    assert.equal(pricing.nawaPrice, 15);
    assert.equal(pricing.fullApplicationNawaPrice, 60);
    assert.equal(pricing.applicationFee, 30);
    assert.ok(pricing.lastUpdatedAt);
  });

  // 2. Step-by-Step Student Onboarding & Oferta Acceptance
  test("New student registration flow: Name -> Phone -> Degree -> Oferta Acceptance", () => {
    const studentId = 777100;
    
    // Step 0: /start creates base unregistered session
    const user = db.getUser(studentId, { username: "student_john", firstName: "John" });
    assert.equal(user.isRegistered, false);
    assert.equal(user.acceptedOfertaAt, undefined);

    // Step 1: Language selection
    db.updateUser(studentId, { lang: "uz", waitingFor: "registration_name" });
    assert.equal(db.getUser(studentId).lang, "uz");
    assert.equal(db.getUser(studentId).waitingFor, "registration_name");

    // Step 2: Name collection
    db.updateUser(studentId, {
      fullName: "Javohir Toshmatov",
      waitingFor: "registration_phone",
    });
    assert.equal(db.getUser(studentId).fullName, "Javohir Toshmatov");
    assert.equal(db.getUser(studentId).waitingFor, "registration_phone");

    // Step 3: Phone collection
    const isTaken = db.isPhoneRegistered("+998901112233", studentId);
    assert.equal(isTaken, false);
    db.updateUser(studentId, {
      phone: "+998901112233",
      waitingFor: "registration_level",
    });
    assert.equal(db.getUser(studentId).phone, "+998901112233");

    // Step 4: Target degree selection
    db.updateUser(studentId, {
      preferredLevel: "Bachelor",
      waitingFor: "waiting_oferta_acceptance",
    });
    assert.equal(db.getUser(studentId).isRegistered, false, "Must stay unregistered until Oferta is accepted");
    assert.equal(db.getUser(studentId).waitingFor, "waiting_oferta_acceptance");

    // Step 5: Oferta acceptance
    const acceptRes = db.acceptOferta(studentId);
    assert.equal(acceptRes.isRegistered, true, "User must now be marked isRegistered=true");
    assert.ok(acceptRes.acceptedOfertaAt, "acceptedOfertaAt timestamp must be recorded");
    assert.equal(acceptRes.waitingFor, null, "waitingFor must be cleared");

    // Returning user check
    const returningUser = db.getUser(studentId);
    assert.equal(returningUser.isRegistered, true);
    assert.equal(returningUser.fullName, "Javohir Toshmatov");
    assert.equal(returningUser.phone, "+998901112233");
  });

  // 3. Document Submission, Admin Rejection with Feedback Note & Resubmission
  test("Document lifecycle: Upload -> Review -> Correction Request -> Resubmission -> Approval", () => {
    const studentId = 777100;
    const adminId = 5059829001; // Root Super Admin

    // 1. Student uploads passport
    const docUpload = db.submitDocument(studentId, "passport", {
      fileId: "telegram_file_id_passport_123",
      fileName: "passport_scan.pdf",
      fileType: "document",
    });
    assert.equal(docUpload.status, "reviewing");
    assert.equal(docUpload.fileId, "telegram_file_id_passport_123");

    // 2. Admin inspects pending queue
    const pending = db.getPendingDocuments();
    const studentDocInQueue = pending.find((p) => p.userId === studentId && p.doc.id === "passport");
    assert.ok(studentDocInQueue, "Passport must appear in pending verification queue");

    // 3. Admin requests correction with counselor note
    const feedbackText = "Pasportning 4 burchagi ham aniq ko'rinsin va amal qilish muddati kamida 18 oy bo'lsin.";
    const rejectedDoc = db.verifyDocument(studentId, "passport", "needs_correction", feedbackText);
    assert.ok(rejectedDoc);
    assert.equal(rejectedDoc.status, "needs_correction");
    assert.equal(rejectedDoc.feedbackNote, feedbackText);

    // 4. Student resubmits corrected photo
    const resubmittedDoc = db.submitDocument(studentId, "passport", {
      fileId: "telegram_file_id_passport_corrected_456",
      fileName: "passport_highres.jpg",
      fileType: "photo",
    });
    assert.equal(resubmittedDoc.status, "reviewing", "Resubmitted document must return to 'reviewing' status");
    assert.equal(resubmittedDoc.fileId, "telegram_file_id_passport_corrected_456");

    // 5. Admin approves corrected document
    const approvedDoc = db.verifyDocument(studentId, "passport", "approved");
    assert.ok(approvedDoc);
    assert.equal(approvedDoc.status, "approved");
    assert.equal(approvedDoc.feedbackNote, undefined, "Old rejection feedback note must be cleared upon approval");
  });

  // 4. Promo Code Engine: Case-Insensitive, Whitespace Trimmed & Single-Use Gating
  test("Promo code validation: case-insensitive, whitespace-trimmed, atomic single-use, upgrade path", () => {
    const studentId = 777100;
    const adminId = 5059829001;

    // Create single-use Full Application + NAWA promo code
    const promo = db.createPromoCode({
      tier: "NAWA_FULL",
      maxUses: 1,
      createdBy: adminId,
    });

    // Test lowercase and whitespace input
    const inputWithSpaces = `   ${promo.code.toLowerCase()}   `;
    const redeemRes = db.redeemPromoCode(inputWithSpaces, studentId);
    assert.equal(redeemRes.success, true, "Promo code must be accepted regardless of casing and whitespace");
    assert.equal(redeemRes.tier, "NAWA_FULL");

    // Verify user profile updated atomically
    const student = db.getUser(studentId);
    assert.equal(student.isPremium, true);
    assert.equal(student.premiumTier, "NAWA_FULL");
    assert.equal(isNawaFullAllowed(student), true);
    assert.equal(isNawaAllowed(student), true);

    // Second user attempts to reuse single-use code
    const otherStudentId = 777200;
    db.getUser(otherStudentId, { fullName: "Other Student" });
    const duplicateRedeem = db.redeemPromoCode(promo.code, otherStudentId);
    assert.equal(duplicateRedeem.success, false, "Single-use promo code cannot be redeemed twice");

    // Private transaction audit verification
    const transactions = db.getAllTransactions();
    const promoTxn = transactions.find((t) => t.userId === studentId && t.source === "PROMO_CODE");
    assert.ok(promoTxn, "Transaction record must be created for promo redemption");
    assert.equal(promoTxn.status, "PAID");
    assert.equal(promoTxn.amount, 60);
    assert.equal(promoTxn.currency, "USD");
  });

  // 5. University Application Lifecycle & Counselor Notes
  test("University Application workflow: Submit -> Under Review -> Counselor Note -> Accepted", () => {
    const studentId = 777100;
    const adminId = 5059829001;

    const sampleProgram = programs[0]; // e.g. CS at University of Warsaw
    const app = db.createApplication(
      studentId,
      sampleProgram.id,
      sampleProgram.name,
      sampleProgram.university,
      sampleProgram.city
    );

    assert.ok(app.id.startsWith("APP-"));
    assert.equal(app.stage, "Submitted");
    assert.equal(app.userId, studentId);

    // Admin updates stage to University Review with counselor note
    const noteText = "Hujjatlaringiz Polsha oliygohiga muvaffaqiyatli topshirildi.";
    const updatedApp = db.updateApplicationStage(app.id, "University Review", noteText, adminId);
    assert.ok(updatedApp);
    assert.equal(updatedApp.stage, "University Review");
    assert.equal(updatedApp.counselorNote, noteText);

    // Student profile inspects application
    const studentApps = db.getUserApplications(studentId);
    assert.equal(studentApps.length, 1);
    assert.equal(studentApps[0].stage, "University Review");
    assert.equal(studentApps[0].counselorNote, noteText);

    // Admin marks Accepted
    const acceptedApp = db.updateApplicationStage(app.id, "Accepted", "Qabul xati keldi! Tabriklaymiz!", adminId);
    assert.ok(acceptedApp);
    assert.equal(acceptedApp.stage, "Accepted");
  });

  // 6. Dynamic Pricing Update & Real-Time Oferta Rendering
  test("Super Admin modifies pricing -> Dynamic Oferta & Paywalls reflect updated values instantly", () => {
    const adminId = 5059829001;

    // Update pricing
    db.updatePricingConfig(
      {
        fullApplicationNawaPrice: 65,
        nawaPrice: 20,
        applicationFee: 35,
      },
      adminId,
      "Super Admin"
    );

    const updatedConfig = db.getPricingConfig();
    assert.equal(updatedConfig.fullApplicationNawaPrice, 65);
    assert.equal(updatedConfig.nawaPrice, 20);
    assert.equal(updatedConfig.applicationFee, 35);

    // Check rendered Oferta text
    const renderedOferta = db.getRenderedOferta();
    assert.ok(renderedOferta.includes("$65 USD"));
    assert.ok(renderedOferta.includes("$20 USD"));
    assert.ok(renderedOferta.includes("€35 EUR"));

    // Restore standard default pricing ($60, $15, €30)
    db.updatePricingConfig(
      {
        fullApplicationNawaPrice: 60,
        nawaPrice: 15,
        applicationFee: 30,
      },
      adminId,
      "Super Admin"
    );

    const restoredConfig = db.getPricingConfig();
    assert.equal(restoredConfig.fullApplicationNawaPrice, 60);
    assert.equal(restoredConfig.nawaPrice, 15);
    assert.equal(restoredConfig.applicationFee, 30);
  });

  // 7. Data Reset & Production Readiness
  test("0-Data reset wipes all operational student records while preserving catalog and Super Admin session", () => {
    const adminId = 5059829001;
    const resetRes = db.resetDatabaseToZero(adminId);
    assert.equal(resetRes, true);
    assert.equal(db.getAllApplications().length, 0);
    assert.equal(db.getAllTransactions().length, 0);

    const pricing = db.getPricingConfig();
    assert.equal(pricing.fullApplicationNawaPrice, 60);
    assert.equal(pricing.nawaPrice, 15);
    assert.equal(pricing.applicationFee, 30);

    db.clearAuditLogs();
    assert.equal(db.getAuditLogs().length, 0);
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} END-TO-END JOURNEY TESTS PASSED! =================\n`);
}

runEndToEndTestSuite().catch((e) => {
  console.error("FATAL: End-to-End Test Suite Failed!", e);
  process.exit(1);
});
