import { strict as assert } from "assert";
import { db } from "../src/bot/services/db";
import { startAdminSession, isAuthorizedSuperAdmin, isAuthorizedAdmin } from "../src/bot/services/auth";
import { isNawaAllowed, isNawaFullAllowed } from "../src/bot/utils/paywall";

async function runFinancialTestSuite() {
  console.log("\n💰 ================= STARTING FINANCIAL & TRANSACTION TEST SUITE =================");

  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      throw err;
    }
  }

  db.resetDatabaseToZero(5059829001);

  // 1. Transaction Generation & ID format
  test("Transaction IDs are uniquely generated with TXN- prefix", () => {
    const id1 = db.generateTransactionId();
    const id2 = db.generateTransactionId();

    assert.ok(id1.startsWith("TXN-"), "ID must start with TXN-");
    assert.ok(id2.startsWith("TXN-"), "ID must start with TXN-");
    assert.notEqual(id1, id2, "Transaction IDs must be unique");
  });

  // 2. Unverified External Payment Creation
  test("Super Admin can record an UNVERIFIED external payment", () => {
    const superAdminId = 5059829001;
    const studentId = 777101;
    startAdminSession(superAdminId, "super_admin");

    const txn = db.createTransaction({
      userId: studentId,
      product: "NAWA_FULL",
      amount: 60,
      status: "UNVERIFIED",
      source: "EXTERNAL_TRANSFER",
      notes: "Student sent bank transfer receipt via Telegram",
      actorId: superAdminId,
    });

    assert.ok(txn.id);
    assert.equal(txn.userId, studentId);
    assert.equal(txn.product, "NAWA_FULL");
    assert.equal(txn.amount, 60);
    assert.equal(txn.status, "UNVERIFIED");
    assert.equal(txn.source, "EXTERNAL_TRANSFER");

    // Student should NOT have premium yet while payment is unverified!
    const student = db.getUser(studentId);
    assert.equal(student.isPremium, false, "Unverified payment must NOT grant premium access");
    assert.equal(isNawaFullAllowed(student), false);
  });

  // 3. Super Admin Manual Payment Verification
  test("Super Admin verifies UNVERIFIED payment -> Status becomes PAID & activates premium", () => {
    const superAdminId = 5059829001;
    const studentId = 777102;
    startAdminSession(superAdminId, "super_admin");

    // Create unverified
    const txn = db.createTransaction({
      userId: studentId,
      product: "NAWA",
      amount: 15,
      status: "UNVERIFIED",
      source: "EXTERNAL_TRANSFER",
    });

    // Verify payment
    const res = db.verifyPaymentTransaction(txn.id, superAdminId, "Confirmed in bank statement");
    assert.equal(res.success, true);
    assert.equal(res.transaction?.status, "PAID");
    assert.equal(res.transaction?.verifiedBy, superAdminId);
    assert.ok(res.transaction?.verifiedAt);

    // Student should now have NAWA entitlement
    const student = db.getUser(studentId);
    assert.equal(student.isPremium, true);
    assert.equal(student.premiumTier, "NAWA");
    assert.equal(student.premiumGrantReason, "VERIFIED_PAYMENT");
    assert.equal(student.premiumTransactionId, txn.id);
    assert.equal(isNawaAllowed(student), true);
    assert.equal(isNawaFullAllowed(student), false, "NAWA must not get NAWA_FULL");

    // Audit log check
    const logs = db.getAuditLogs(5);
    const verifyLog = logs.find((l) => l.action === "PAYMENT_VERIFIED" && l.target === txn.id);
    assert.ok(verifyLog, "Must log PAYMENT_VERIFIED audit event");
    assert.equal(verifyLog.actorRole, "super_admin");
  });

  // 4. Promo Code Redemption Creates Linked Transaction
  test("Promo code redemption creates private transaction record attributed as PROMO_CODE", () => {
    const studentId = 777103;
    const promo = db.createPromoCode({ tier: "NAWA_FULL", maxUses: 1 });

    const redeemRes = db.redeemPromoCode(promo.code, studentId);
    assert.equal(redeemRes.success, true);

    const student = db.getUser(studentId);
    assert.equal(student.isPremium, true);
    assert.equal(student.premiumTier, "NAWA_FULL");
    assert.equal(student.premiumGrantReason, "PROMO_CODE");
    assert.ok(student.premiumTransactionId, "Must link to transaction ID");

    const txn = db.getTransaction(student.premiumTransactionId!);
    assert.ok(txn, "Transaction record must exist in database");
    assert.equal(txn.status, "PAID");
    assert.equal(txn.source, "PROMO_CODE");
    assert.equal(txn.promoCode, promo.code);
    assert.equal(txn.amount, 60);
  });

  // 5. Accurate Real-Time Financial Calculations
  test("Financial summary accurately computes revenue, sales breakdown, and unverified counts", () => {
    const summary = db.getFinancialSummary();

    assert.ok(typeof summary.totalVerifiedRevenue === "number");
    assert.ok(typeof summary.verifiedPaymentsCount === "number");
    assert.ok(typeof summary.nawaCount === "number");
    assert.ok(typeof summary.nawaRevenue === "number");
    assert.ok(typeof summary.nawaFullCount === "number");
    assert.ok(typeof summary.nawaFullRevenue === "number");
    assert.ok(typeof summary.unverifiedCount === "number");

    // Math check: nawaRevenue + nawaFullRevenue <= totalVerifiedRevenue
    assert.equal(
      summary.nawaRevenue + summary.nawaFullRevenue,
      summary.totalVerifiedRevenue,
      "Revenue must equal NAWA + NAWA Full totals"
    );
  });

  // 6. Super Admin Refund Workflow
  test("Super Admin refund marks transaction REFUNDED and revokes premium entitlement", () => {
    const superAdminId = 5059829001;
    const studentId = 777104;

    const txn = db.createTransaction({
      userId: studentId,
      product: "NAWA_FULL",
      amount: 60,
      status: "UNVERIFIED",
      source: "EXTERNAL_TRANSFER",
    });

    const verifyRes = db.verifyPaymentTransaction(txn.id, superAdminId);
    assert.equal(verifyRes.success, true);
    assert.equal(db.getUser(studentId).isPremium, true);

    // Issue refund
    const refundSuccess = db.refundPaymentTransaction(txn.id, superAdminId, "User requested refund");
    assert.equal(refundSuccess, true);

    const updatedTxn = db.getTransaction(txn.id);
    assert.equal(updatedTxn?.status, "REFUNDED");

    // Student premium must be revoked
    const student = db.getUser(studentId);
    assert.equal(student.isPremium, false);
    assert.equal(student.premiumTier, "Free");
  });

  // 7. Normal Admin Role Separation
  test("Normal Admin is authorized as admin but NOT as super_admin", () => {
    const adminId = 888101;
    startAdminSession(adminId, "admin");

    assert.equal(isAuthorizedAdmin(adminId), true, "Admin must be authorized as admin");
    assert.equal(isAuthorizedSuperAdmin(adminId), false, "Admin must NOT be authorized as super_admin");
  });

  // 8. Super Admin User Inspection
  test("User session record stores exact grant reason and transaction ID for Super Admin inspection", () => {
    const student = db.getUser(777103);
    assert.ok(student.premiumGrantReason);
    assert.ok(student.premiumTransactionId);
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} FINANCIAL TESTS PASSED! =================\n`);
}

runFinancialTestSuite().catch((e) => {
  console.error("FATAL: Financial Test Suite Failed!", e);
  process.exit(1);
});
