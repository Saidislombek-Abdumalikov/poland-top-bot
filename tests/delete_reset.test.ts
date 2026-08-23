import { strict as assert } from "assert";
import { db } from "../src/bot/services/db";
import { startAdminSession, isAuthorizedSuperAdmin, isAuthorizedAdmin } from "../src/bot/services/auth";
import { config } from "../src/bot/config";

async function runDeleteAndResetTestSuite() {
  console.log("\n🗑️ ================= STARTING DELETE & 0-DATA RESET TEST SUITE =================");

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

  // 1. Super Admin Delete Regular User
  test("Super Admin can completely delete a user and all their applications/transactions", () => {
    const superAdminId = config.superAdminTelegramId;
    const testStudentId = 999101;

    // Create user with application and transaction
    db.getUser(testStudentId);
    db.updateUser(testStudentId, { fullName: "Test Deletable Student", isPremium: true });
    db.createApplication(testStudentId, "prog_1", "CS Bachelor", "University of Warsaw", "Warsaw");
    db.createTransaction({
      userId: testStudentId,
      product: "NAWA_FULL",
      amount: 50,
      status: "PAID",
    });

    assert.ok(db.getUser(testStudentId));
    assert.equal(db.getUserApplications(testStudentId).length, 1);

    // Super Admin deletes user
    const deleted = db.deleteUser(testStudentId, superAdminId);
    assert.equal(deleted, true);

    // Verify user is gone
    const allUsers = db.getAllUsers();
    assert.equal(allUsers.find((u) => u.userId === testStudentId), undefined, "User must not exist");
    assert.equal(db.getUserApplications(testStudentId).length, 0, "User applications must be deleted");
  });

  // 2. Super Admin Delete Admin Record
  test("Super Admin can permanently delete a secondary admin", () => {
    const superAdminId = config.superAdminTelegramId;
    const secondaryAdminId = 999202;

    const adm = db.getUser(secondaryAdminId);
    db.updateUser(secondaryAdminId, { fullName: "Temporary Admin", isAdmin: true, adminRole: "admin" });

    assert.equal(db.getAllAdmins(false).some((a) => a.userId === secondaryAdminId), true);

    // Delete admin
    const res = db.deleteAdmin(secondaryAdminId, superAdminId);
    assert.equal(res.success, true);

    // Verify admin is gone
    assert.equal(db.getAllAdmins(true).some((a) => a.userId === secondaryAdminId), false);
    assert.equal(db.getAllUsers().some((u) => u.userId === secondaryAdminId), false);
  });

  // 3. Root Super Admin Protection
  test("Root Super Admin cannot be deleted", () => {
    const superAdminId = config.superAdminTelegramId;
    const res = db.deleteAdmin(superAdminId, superAdminId);
    assert.equal(res.success, false);
    assert.equal(res.error, "Root Super Admin cannot be deleted.");
  });

  // 4. Database Reset to 0-Data
  test("resetDatabaseToZero completely wipes operational records and preserves catalogs", () => {
    // Populate some dummy test data
    db.getUser(111);
    db.getUser(222);
    db.createPromoCode({ tier: "NAWA", maxUses: 1 });

    assert.ok(db.getAllUsers().length >= 2);
    assert.ok(db.getAllPromoCodes().length >= 1);

    // Execute 0-data reset
    const resetOk = db.resetDatabaseToZero(config.superAdminTelegramId);
    assert.equal(resetOk, true);

    // Verify 0-data
    assert.equal(db.getAllUsers().length, 0, "Users must be empty (0)");
    assert.equal(db.getAllPromoCodes().length, 0, "Promo codes must be empty (0)");
    assert.equal(db.getAllApplications().length, 0, "Applications must be empty (0)");
    assert.equal(db.getAllTransactions().length, 0, "Transactions must be empty (0)");
    assert.equal(db.getAllReviews().length, 0, "Reviews must be empty (0)");

    // Catalogs preserved
    assert.ok(db.getAllUniversities().length > 0, "Universities catalog must be preserved");
    assert.ok(Object.keys(db.getDocumentDefinitions()).length > 0, "Document definitions must be preserved");
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} DELETE & RESET TESTS PASSED! =================\n`);
}

runDeleteAndResetTestSuite().catch((e) => {
  console.error("FATAL: Delete & Reset Test Suite Failed!", e);
  process.exit(1);
});
