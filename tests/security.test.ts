import { strict as assert } from "assert";
import {
  sha256Hash,
  verifySecret,
  authenticatePasscode,
  startAdminSession,
  endAdminSession,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
  sanitizeAuditText,
  SESSION_DURATION_MS,
} from "../src/bot/services/auth";
import { db } from "../src/bot/services/db";

async function runSecurityTestSuite() {
  console.log("\n🔒 ================= STARTING SECURITY ARCHITECTURE TEST SUITE =================");

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

  // 1. Password Hashing & Constant-Time Verification
  test("SHA-256 Hashing generates correct deterministic digests", () => {
    const hash1 = sha256Hash("PTUADMIN2025");
    const hash2 = sha256Hash("super*admin");
    assert.equal(hash1, "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b");
    assert.equal(hash2, "524ebee4ea5727134ed3a89f4b14f5086bcdb822a718e3c1420d891c9efc4bc9");
  });

  test("Constant-time verification handles valid and invalid secrets correctly", () => {
    const targetHash = sha256Hash("MySecretPassword123");
    assert.equal(verifySecret("MySecretPassword123", targetHash), true);
    assert.equal(verifySecret("WrongPassword", targetHash), false);
    assert.equal(verifySecret("", targetHash), false);
    assert.equal(verifySecret("MySecretPassword123", ""), false);
  });

  // 2. Authentication & Role Determination
  test("Normal Admin passcode authenticates strictly as 'admin'", () => {
    const role = authenticatePasscode("PTUADMIN2025");
    assert.equal(role, "admin");
  });

  test("Super Admin passcode authenticates strictly as 'super_admin'", () => {
    const role = authenticatePasscode("super*admin");
    assert.equal(role, "super_admin");
  });

  test("Invalid passwords return null without revealing role information", () => {
    assert.equal(authenticatePasscode("wrong_pass"), null);
    assert.equal(authenticatePasscode("admin"), null);
    assert.equal(authenticatePasscode(""), null);
  });

  // 3. Server-Side Session Management & Authorization
  test("Starting Normal Admin session grants only normal admin privileges", () => {
    const testUserId = 999901;
    startAdminSession(testUserId, "admin");

    assert.equal(isAuthorizedAdmin(testUserId), true);
    assert.equal(isAuthorizedSuperAdmin(testUserId), false);

    const user = db.getUser(testUserId);
    assert.equal(user.isAdmin, true);
    assert.equal(user.isSuperAdmin, false);
    assert.equal(user.adminRole, "admin");
    assert.ok(user.adminSessionExpiresAt && user.adminSessionExpiresAt > Date.now());
  });

  test("Starting Super Admin session grants both admin and super admin privileges", () => {
    const superUserId = 999902;
    startAdminSession(superUserId, "super_admin");

    assert.equal(isAuthorizedAdmin(superUserId), true);
    assert.equal(isAuthorizedSuperAdmin(superUserId), true);

    const user = db.getUser(superUserId);
    assert.equal(user.isAdmin, true);
    assert.equal(user.isSuperAdmin, true);
    assert.equal(user.adminRole, "super_admin");
  });

  test("Ending admin session revokes all privileges immediately", () => {
    const testUserId = 999901;
    endAdminSession(testUserId);

    assert.equal(isAuthorizedAdmin(testUserId), false);
    assert.equal(isAuthorizedSuperAdmin(testUserId), false);

    const user = db.getUser(testUserId);
    assert.equal(user.isAdmin, false);
    assert.equal(user.isSuperAdmin, false);
    assert.equal(user.adminRole, null);
  });

  test("Expired session is automatically invalidated server-side", () => {
    const expiredUserId = 999903;
    startAdminSession(expiredUserId, "admin");
    // Manually backdate expiration
    db.updateUser(expiredUserId, { adminSessionExpiresAt: Date.now() - 1000 });

    assert.equal(isAuthorizedAdmin(expiredUserId), false);
    assert.equal(isAuthorizedSuperAdmin(expiredUserId), false);
  });

  // 4. Super Admin Invisibility to Normal Admins
  test("db.getAllAdmins(false) completely excludes Super Admins for normal admins", () => {
    const normalAdminId = 888801;
    const superAdminId = 888802;

    startAdminSession(normalAdminId, "admin");
    startAdminSession(superAdminId, "super_admin");

    const normalAdminView = db.getAllAdmins(false);
    const hasSuperInNormalView = normalAdminView.some((u) => u.userId === superAdminId || u.isSuperAdmin);
    assert.equal(hasSuperInNormalView, false, "Super Admin MUST NOT appear in normal admin list");

    const superAdminView = db.getAllAdmins(true);
    const hasSuperInSuperView = superAdminView.some((u) => u.userId === superAdminId);
    assert.equal(hasSuperInSuperView, true, "Super Admin appears only in Super Admin HQ view");
  });

  // 5. Audit Logging & Sanitization
  test("Sensitive credentials are automatically sanitized from audit logs", () => {
    const actorId = 888802;
    const dirtyText = "User tried to login with super*admin and PTUADMIN2025 password";
    const cleanText = sanitizeAuditText(dirtyText);

    assert.equal(cleanText.includes("super*admin"), false);
    assert.equal(cleanText.includes("PTUADMIN2025"), false);
    assert.ok(cleanText.includes("[PROTECTED_CREDENTIAL]"));

    const entry = db.logAdminAction(actorId, "Super Admin", "TEST_ACTION", dirtyText, "PTUADMIN2025");
    assert.equal(entry.details.includes("super*admin"), false);
    assert.equal(entry.details.includes("PTUADMIN2025"), false);
    assert.equal(entry.target?.includes("PTUADMIN2025"), false);
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} SECURITY TESTS PASSED! =================\n`);
}

runSecurityTestSuite().catch((e) => {
  console.error("FATAL: Security Test Suite Failed!", e);
  process.exit(1);
});
