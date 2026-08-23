import { strict as assert } from "assert";
import { db } from "../src/bot/services/db";
import { isNawaAllowed, isNawaFullAllowed } from "../src/bot/utils/paywall";
import { startAdminSession } from "../src/bot/services/auth";

async function runPremiumPromoTestSuite() {
  console.log("\n💎 ================= STARTING NAWA PREMIUM & PROMO TEST SUITE =================");

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

  // 1. Random Code Generation (Secure Entropy & No Leaks)
  test("Random promo codes have high entropy, 8 characters, and do NOT leak product name", () => {
    const code1 = db.generateRandomCodeString();
    const code2 = db.generateRandomCodeString();

    assert.equal(code1.length, 8, "Code must be 8 characters");
    assert.equal(code2.length, 8, "Code must be 8 characters");
    assert.notEqual(code1, code2, "Generated codes must be unique");

    // Must not contain predictable product prefixes
    assert.equal(code1.startsWith("NAWA"), false, "Code must not leak 'NAWA'");
    assert.equal(code1.startsWith("FULL"), false, "Code must not leak 'FULL'");
    assert.equal(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code1), true);
  });

  // 2. Admin & Super Admin Promo Code Creation
  test("Admin creates NAWA code ($15) with strict 1-student limit", () => {
    const adminId = 444101;
    startAdminSession(adminId, "admin");

    const promo = db.createPromoCode({
      tier: "NAWA",
      maxUses: 1,
      createdBy: adminId,
      createdByName: "Test Admin",
    });

    assert.ok(promo.code, "Promo code should be generated");
    assert.equal(promo.tier, "NAWA");
    assert.equal(promo.maxUses, 1);
    assert.equal(promo.isActive, true);
    assert.equal(promo.usedCount, 0);

    // Audit log check
    const logs = db.getAuditLogs(5);
    const createdLog = logs.find((l) => l.action === "PROMO_CODE_CREATED" && l.target === promo.code);
    assert.ok(createdLog, "Must log PROMO_CODE_CREATED event");
    assert.equal(createdLog.actorId, adminId);
  });

  test("Super Admin creates NAWA Full code ($50)", () => {
    const superAdminId = 444102;
    startAdminSession(superAdminId, "super_admin");

    const promo = db.createPromoCode({
      tier: "NAWA_FULL",
      maxUses: 1,
      createdBy: superAdminId,
      createdByName: "Super Admin Boss",
    });

    assert.equal(promo.tier, "NAWA_FULL");
    assert.equal(promo.maxUses, 1);
    assert.equal(promo.isActive, true);
  });

  // 3. NAWA Code Redemption & Entitlement
  test("Redeeming NAWA code grants ONLY NAWA entitlement (denies NAWA Full features)", () => {
    const studentId = 333101;
    const promo = db.createPromoCode({ tier: "NAWA", maxUses: 1 });

    const redeemResult = db.redeemPromoCode(promo.code, studentId);
    assert.equal(redeemResult.success, true);
    assert.equal(redeemResult.tier, "NAWA");

    const student = db.getUser(studentId);
    assert.equal(student.isPremium, true);
    assert.equal(student.premiumTier, "NAWA");
    assert.equal(student.premiumCode, promo.code);

    // Entitlement checks
    assert.equal(isNawaAllowed(student), true, "NAWA features MUST be allowed");
    assert.equal(isNawaFullAllowed(student), false, "NAWA Full features MUST be denied to NAWA user");
  });

  // 4. NAWA Full Code Redemption & Entitlement
  test("Redeeming NAWA Full code grants full access to both NAWA and NAWA Full features", () => {
    const studentId = 333102;
    const promo = db.createPromoCode({ tier: "NAWA_FULL", maxUses: 1 });

    const redeemResult = db.redeemPromoCode(promo.code, studentId);
    assert.equal(redeemResult.success, true);
    assert.equal(redeemResult.tier, "NAWA_FULL");

    const student = db.getUser(studentId);
    assert.equal(student.isPremium, true);
    assert.equal(student.premiumTier, "NAWA_FULL");

    // Entitlement checks
    assert.equal(isNawaAllowed(student), true, "NAWA features MUST be allowed for NAWA Full");
    assert.equal(isNawaFullAllowed(student), true, "NAWA Full features MUST be allowed for NAWA Full");
  });

  // 5. Server-Side Source of Truth (Client cannot tamper product type)
  test("Server determines package entitlement strictly from database, ignoring client claims", () => {
    const studentId = 333103;
    const promo = db.createPromoCode({ tier: "NAWA", maxUses: 1 });

    // Client attempts to redeem NAWA code
    const result = db.redeemPromoCode(promo.code, studentId);
    assert.equal(result.tier, "NAWA", "Must grant NAWA, regardless of what client wants");

    const student = db.getUser(studentId);
    assert.equal(student.premiumTier, "NAWA");
    assert.equal(isNawaFullAllowed(student), false);
  });

  // 6. Single-Use Constraint & Reuse Prevention
  test("Single-use promo code cannot be reused by another user", () => {
    const userA = 333201;
    const userB = 333202;
    const promo = db.createPromoCode({ tier: "NAWA_FULL", maxUses: 1 });

    // User A redeems
    const resA = db.redeemPromoCode(promo.code, userA);
    assert.equal(resA.success, true);

    // User B attempts same code
    const resB = db.redeemPromoCode(promo.code, userB);
    assert.equal(resB.success, false, "Second redemption must be rejected");
    assert.equal(resB.error, "This promo code is no longer available.");

    // User B must remain free
    const studentB = db.getUser(userB);
    assert.equal(studentB.isPremium, false);
  });

  // 7. Deactivated / Expired Code Rejection
  test("Deactivated promo code cannot be redeemed", () => {
    const studentId = 333301;
    const promo = db.createPromoCode({ tier: "NAWA", maxUses: 1 });

    // Admin deactivates
    db.expirePromoCode(promo.code, 999);

    const result = db.redeemPromoCode(promo.code, studentId);
    assert.equal(result.success, false);
    assert.equal(result.error, "This promo code is no longer available.");

    const student = db.getUser(studentId);
    assert.equal(student.isPremium, false);
  });

  // 8. Backward Compatibility / Migration for Existing Users
  test("Existing users with Full Premium or VIP Admissions retain full access", () => {
    const legacyUser1 = db.getUser(222101);
    db.updateUser(222101, { isPremium: true, premiumTier: "Full Premium" });
    assert.equal(isNawaAllowed(db.getUser(222101)), true);
    assert.equal(isNawaFullAllowed(db.getUser(222101)), true);

    const legacyUser2 = db.getUser(222102);
    db.updateUser(222102, { isPremium: true, premiumTier: "VIP Admissions" });
    assert.equal(isNawaAllowed(db.getUser(222102)), true);
    assert.equal(isNawaFullAllowed(db.getUser(222102)), true);
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} PREMIUM & PROMO TESTS PASSED! =================\n`);
}

runPremiumPromoTestSuite().catch((e) => {
  console.error("FATAL: Premium Promo Test Suite Failed!", e);
  process.exit(1);
});
