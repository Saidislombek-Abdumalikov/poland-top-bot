import assert from "node:assert/strict";
import { db } from "../src/bot/services/db";
import { isNawaFullAllowed } from "../src/bot/utils/paywall";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    throw err;
  }
}

export function runTestMaterialsTestSuite() {
  console.log("\n📝 ================= STARTING TEST MATERIALS (TESTLAR) TEST SUITE =================");

  // 1. Initial State & Defaults
  test("Database initializes with active default test materials (PDF & Links)", () => {
    const tests = db.getAllTests();
    assert.ok(tests.length >= 4, "Should have at least 4 default test materials");

    const polB1 = db.getTest("test-pol-b1");
    assert.ok(polB1, "Polish B1 test must exist");
    assert.equal(polB1?.isFree, true, "Polish B1 should be free demo");
    assert.equal(polB1?.subject, "Polyak tili (B1)");

    const mathTest = db.getTest("test-math-entrance");
    assert.ok(mathTest, "Math entrance test must exist");
    assert.equal(mathTest?.isFree, false, "Math test should be VIP");
    assert.equal(mathTest?.subject, "Matematika");
  });

  // 2. Admin Creates New Test Material (Document fileId)
  test("Admin creates new Test Material with Telegram PDF fileId", () => {
    const adminId = 5059829001;
    const newTest = db.createTest(
      {
        id: "test-wut-cs-2025",
        title: {
          en: "Warsaw University of Technology — CS Exam 2025 (PDF)",
          uz: "Varshava Politexnika — Dasturlash Kirish Testi 2025 (PDF)",
        },
        subject: "Dasturlash / CS",
        description: {
          en: "Official Computer Science entrance exam problems and algorithms.",
          uz: "Dasturlash va algoritmlar bo'yicha rasmiy imtihon savollari.",
        },
        fileId: "telegram_pdf_file_wut_cs_2025",
        fileName: "WUT_CS_Entrance_2025.pdf",
        fileType: "document",
        isFree: false,
      },
      adminId,
      "Super Admin"
    );

    assert.equal(newTest.id, "test-wut-cs-2025");
    assert.equal(newTest.fileId, "telegram_pdf_file_wut_cs_2025");
    assert.equal(newTest.isFree, false);

    const fetched = db.getTest("test-wut-cs-2025");
    assert.ok(fetched);
    assert.equal(fetched?.fileName, "WUT_CS_Entrance_2025.pdf");

    // Verify audit log
    const logs = db.getAuditLogs(10);
    const createdLog = logs.find((l) => l.action === "CREATE_TEST_MATERIAL");
    assert.ok(createdLog, "Audit log should record CREATE_TEST_MATERIAL");
    assert.equal(createdLog?.actorId, adminId);
  });

  // 3. Admin Updates Test Material
  test("Admin updates Test Material title, subject, and toggles VIP / Free status", () => {
    const adminId = 5059829001;
    const updated = db.updateTest(
      "test-wut-cs-2025",
      {
        title: {
          en: "WUT Computer Science & AI Exam 2025 (PDF)",
          uz: "Varshava Politexnika — AI & Dasturlash Testi 2025 (PDF)",
        },
        subject: "Sun'iy Intellekt / CS",
        isFree: true, // Made free demo
      },
      adminId,
      "Super Admin"
    );

    assert.ok(updated);
    assert.equal(updated?.title.en, "WUT Computer Science & AI Exam 2025 (PDF)");
    assert.equal(updated?.subject, "Sun'iy Intellekt / CS");
    assert.equal(updated?.isFree, true);

    const fetched = db.getTest("test-wut-cs-2025");
    assert.equal(fetched?.isFree, true);

    // Verify audit log
    const logs = db.getAuditLogs(10);
    const updateLog = logs.find((l) => l.action === "UPDATE_TEST_MATERIAL");
    assert.ok(updateLog, "Audit log should record UPDATE_TEST_MATERIAL");
  });

  // 4. Paywall & VIP Access Checking
  test("Paywall correctly identifies Free vs VIP Test Materials", () => {
    const freeStudent = db.getUser(888111, {
      firstName: "Bekzod",
      isPremium: false,
      premiumTier: "Free",
      isRegistered: true,
    });

    const vipStudent = db.getUser(888222, {
      firstName: "Shoxrux",
      isPremium: true,
      premiumTier: "Full Premium",
      isRegistered: true,
    });

    const freeTest = db.getTest("test-pol-b1")!;
    const vipTest = db.getTest("test-math-entrance")!;

    // Free test is accessible to everyone
    assert.equal(freeTest.isFree, true);

    // VIP test requires isNawaFullAllowed
    assert.equal(vipTest.isFree, false);
    assert.equal(isNawaFullAllowed(freeStudent), false, "Free user cannot access VIP test");
    assert.equal(isNawaFullAllowed(vipStudent), true, "VIP user can access VIP test");
  });

  // 5. Admin Deletes Test Material
  test("Admin deletes Test Material and records audit log", () => {
    const adminId = 5059829001;
    const deleted = db.deleteTest("test-wut-cs-2025", adminId, "Super Admin");
    assert.equal(deleted, true);

    const fetched = db.getTest("test-wut-cs-2025");
    assert.equal(fetched, undefined, "Deleted test should no longer exist");

    // Verify audit log
    const logs = db.getAuditLogs(10);
    const delLog = logs.find((l) => l.action === "DELETE_TEST_MATERIAL");
    assert.ok(delLog, "Audit log should record DELETE_TEST_MATERIAL");
  });

  // 6. Database 0-Data Reset restores catalog of default Test Materials
  test("Database reset restores default Test Materials catalog", () => {
    const adminId = 5059829001;
    db.resetDatabaseToZero(adminId);

    const tests = db.getAllTests();
    assert.ok(tests.length >= 4, "Reset should restore default test materials");
    assert.ok(db.getTest("test-pol-b1"), "Polish B1 test should be present after reset");
    assert.ok(db.getTest("test-math-entrance"), "Math test should be present after reset");
  });

  console.log("\n🎉 ================= ALL 6/6 TEST MATERIALS TESTS PASSED! =================\n");
}

runTestMaterialsTestSuite();
