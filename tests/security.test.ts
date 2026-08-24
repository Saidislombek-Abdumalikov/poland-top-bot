import { strict as assert } from "assert";
import {
  sha256Hash,
  verifySecret,
  authenticatePasscode,
  startAdminSession,
  endAdminSession,
  grantAdminRole,
  revokeAdminRole,
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

  // 1. Password Hashing & Secret Verification Tests
  test("SHA-256 Hashing generates correct deterministic digests", () => {
    const hash = sha256Hash("PTUADMIN2025");
    assert.equal(hash, "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b");

    const superHash = sha256Hash("super*admin");
    assert.equal(superHash, "524ebee4ea5727134ed3a89f4b14f5086bcdb822a718e3c1420d891c9efc4bc9");
  });

  test("Constant-time verification handles valid and invalid secrets correctly", () => {
    const targetHash = sha256Hash("MySecurePasscode123!");
    assert.equal(verifySecret("MySecurePasscode123!", targetHash), true);
    assert.equal(verifySecret("WrongPasscode", targetHash), false);
    assert.equal(verifySecret("", targetHash), false);
    assert.equal(verifySecret("MySecurePasscode123!", ""), false);
  });

  // 2. Passcode Authentication & Role Resolution Tests
  test("Normal Admin passcode authenticates strictly as 'admin'", () => {
    const role = authenticatePasscode("PTUADMIN2025");
    assert.equal(role, "admin");
  });

  test("Super Admin passcode authenticates strictly as 'super_admin'", () => {
    const role = authenticatePasscode("super*admin");
    assert.equal(role, "super_admin");
  });

  test("Invalid passwords return null without revealing role information", () => {
    assert.equal(authenticatePasscode("wrongpassword"), null);
    assert.equal(authenticatePasscode("admin123"), null);
    assert.equal(authenticatePasscode(""), null);
  });

  test("Super Admin can change normal admin passcode, invalidating old password and sessions", () => {
    const superAdminId = 888801;
    const normalAdminId = 888802;

    // Normal admin starts session with default password
    assert.equal(authenticatePasscode("PTUADMIN2025"), "admin");
    startAdminSession(normalAdminId, "admin");
    assert.equal(isAuthorizedAdmin(normalAdminId), true);

    // Super admin updates admin passcode
    const newPasscode = "WarszawaAdmin2026!";
    const res = db.setAdminPasscode(newPasscode, superAdminId, "Super Admin");
    assert.equal(res.success, true);

    // Old password fails
    assert.equal(authenticatePasscode("PTUADMIN2025"), null, "Old admin passcode MUST fail");

    // New password succeeds
    assert.equal(authenticatePasscode(newPasscode), "admin", "New admin passcode MUST authenticate as admin");

    // Normal admin active session was invalidated
    assert.equal(isAuthorizedAdmin(normalAdminId), false, "Active sessions MUST be invalidated on password change");

    // Normal admin can log back in with new password
    const reauthRole = authenticatePasscode(newPasscode);
    assert.equal(reauthRole, "admin");
    startAdminSession(normalAdminId, "admin");
    assert.equal(isAuthorizedAdmin(normalAdminId), true);

    // Reset password back for subsequent tests
    db.setAdminPasscode("PTUADMIN2025", superAdminId, "Super Admin");
    assert.equal(authenticatePasscode("PTUADMIN2025"), "admin");
  });

  // 3. Server-Side Session Management Tests
  test("Starting Normal Admin session grants only normal admin privileges", () => {
    const testUserId = 999901;
    const session = startAdminSession(testUserId, "admin");

    assert.equal(session.adminRole, "admin");
    assert.equal(session.isAdmin, true);
    assert.equal(session.isSuperAdmin, false);
    assert.ok(session.adminSessionExpiresAt && session.adminSessionExpiresAt > Date.now());

    assert.equal(isAuthorizedAdmin(testUserId), true);
    assert.equal(isAuthorizedSuperAdmin(testUserId), false);
  });

  test("Starting Super Admin session grants both admin and super admin privileges", () => {
    const testUserId = 999902;
    const session = startAdminSession(testUserId, "super_admin");

    assert.equal(session.adminRole, "super_admin");
    assert.equal(session.isAdmin, true);
    assert.equal(session.isSuperAdmin, true);
    assert.ok(session.adminSessionExpiresAt && session.adminSessionExpiresAt > Date.now());

    assert.equal(isAuthorizedAdmin(testUserId), true);
    assert.equal(isAuthorizedSuperAdmin(testUserId), true);
  });

  test("Ending admin session revokes all privileges immediately", () => {
    const testUserId = 999903;
    startAdminSession(testUserId, "super_admin");
    assert.equal(isAuthorizedSuperAdmin(testUserId), true);

    endAdminSession(testUserId);
    assert.equal(isAuthorizedAdmin(testUserId), false);
    assert.equal(isAuthorizedSuperAdmin(testUserId), false);
  });

  test("Expired session is automatically invalidated server-side", () => {
    const testUserId = 999904;
    startAdminSession(testUserId, "admin");

    // Manually set expiration in the past
    db.updateUser(testUserId, { adminSessionExpiresAt: Date.now() - 1000 });

    assert.equal(isAuthorizedAdmin(testUserId), false);
    assert.equal(isAuthorizedSuperAdmin(testUserId), false);
  });

  // 4. Admin Role Separation & Super Admin Stealth
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

  test("Super Admin is completely invisible in getAllUsers() and searchUsers() to everyone", () => {
    const studentId = 777701;
    const superAdminId = 777702;

    db.getUser(studentId, {
      fullName: "UniqueStudentAlpha",
      isRegistered: true,
      isAdmin: false,
      isSuperAdmin: false,
      adminRole: undefined,
    });
    db.getUser(superAdminId, {
      fullName: "Master Super Admin",
      isSuperAdmin: true,
      adminRole: "super_admin",
    });

    const allUsers = db.getAllUsers();
    assert.equal(allUsers.some((u) => u.userId === superAdminId), false, "Super Admin MUST NOT be in getAllUsers()");
    assert.equal(allUsers.some((u) => u.userId === studentId), true, "Student MUST be in getAllUsers()");

    const searchResults = db.searchUsers("Master");
    assert.equal(searchResults.length, 0, "Super Admin MUST NOT be found in searchUsers()");

    const searchStudent = db.searchUsers("UniqueStudentAlpha");
    assert.equal(searchStudent.length, 1, "Student MUST be found in searchUsers()");
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

  // 6. Admin Permission Revocation & Session Invalidation
  test("revokeAdminRole atomically removes admin permissions and invalidates active sessions", () => {
    const superAdminId = 777701;
    const targetAdminId = 777702;

    startAdminSession(superAdminId, "super_admin");
    grantAdminRole(targetAdminId, superAdminId, false);

    // Verify target is active admin
    assert.equal(isAuthorizedAdmin(targetAdminId), true);
    let targetUser = db.getUser(targetAdminId);
    assert.equal(targetUser.isAdmin, true);
    assert.equal(targetUser.adminRole, "admin");

    // Super Admin revokes permissions
    const revoked = revokeAdminRole(targetAdminId, superAdminId);
    assert.equal(revoked, true, "Revoke operation should return true");

    // Verify target immediately lost authorization
    assert.equal(isAuthorizedAdmin(targetAdminId), false, "Revoked admin MUST fail isAuthorizedAdmin check");
    assert.equal(isAuthorizedSuperAdmin(targetAdminId), false);

    // Verify database state is updated
    targetUser = db.getUser(targetAdminId);
    assert.equal(targetUser.isAdmin, false);
    assert.equal(targetUser.adminRole, null);
    assert.equal(targetUser.adminSessionExpiresAt, 0);

    // Verify audit log has the event
    const logs = db.getAuditLogs(10);
    const revokeLog = logs.find((l) => l.action === "ADMIN_PERMISSION_REVOKED" && l.target === targetAdminId.toString());
    assert.ok(revokeLog, "Audit log must contain ADMIN_PERMISSION_REVOKED event");
    assert.equal(revokeLog.actorId, superAdminId);
  });

  test("Super Admin cannot be demoted or revoked by demote functions", () => {
    const superAdminId = 777701;
    const attackerId = 777703;

    startAdminSession(superAdminId, "super_admin");
    const demoteResult = revokeAdminRole(superAdminId, attackerId);
    assert.equal(demoteResult, false, "Revoking Super Admin must be rejected");

    const superUser = db.getUser(superAdminId);
    assert.equal(superUser.isAdmin, true);
    assert.equal(superUser.isSuperAdmin, true);
    assert.equal(superUser.adminRole, "super_admin");
  });

  // 7. Phone Uniqueness & Registration Binding
  test("Phone number uniqueness prevents two accounts from registering the same phone number", () => {
    const userA = 500101;
    const userB = 500102;
    const phone = "+998901112233";

    db.getUser(userA, { fullName: "User A", phone });
    db.updateUser(userA, { phone });

    // Verify userA is found by phone
    const found = db.getUserByPhone(phone);
    assert.ok(found, "User A must be found by phone");
    assert.equal(found.userId, userA);

    // Check if phone is registered excluding userA -> should be false
    assert.equal(db.isPhoneRegistered(phone, userA), false);

    // Check if phone is registered excluding userB -> should be true (belongs to userA)
    assert.equal(db.isPhoneRegistered(phone, userB), true);
    assert.equal(db.isPhoneRegistered("+998901112233", userB), true);
    assert.equal(db.isPhoneRegistered("998901112233", userB), true);
  });

  // 8. Oferta Acceptance Immortality & Registration Lock
  test("Accepted Oferta immortality preserves registration and prevents repeated prompts on restart", () => {
    const studentId = 500201;
    db.getUser(studentId, {
      fullName: "Dilshod Aliyev",
      phone: "+998909998877",
      preferredLevel: "Bachelor",
      isRegistered: false,
    });

    // Initial state: not registered until Oferta is accepted
    assert.equal(db.getUser(studentId).isRegistered, false);

    // Student accepts Oferta
    const accepted = db.acceptOferta(studentId);
    assert.ok(accepted);
    assert.equal(accepted.isRegistered, true);
    assert.ok(accepted.acceptedOfertaVersion);
    assert.ok(accepted.acceptedOfertaAt);

    // On subsequent restart / reload, isRegistered remains true
    const reloaded = db.getUser(studentId);
    assert.equal(reloaded.isRegistered, true);
    assert.equal(reloaded.acceptedOfertaVersion, accepted.acceptedOfertaVersion);
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} SECURITY & SUPER ADMIN TESTS PASSED! =================\n`);
}

runSecurityTestSuite().catch((e) => {
  console.error("FATAL: Security Test Suite Failed!", e);
  process.exit(1);
});
