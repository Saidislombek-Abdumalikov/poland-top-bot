import assert from "node:assert/strict";
import { db } from "../src/bot/services/db";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    throw err;
  }
}

export function runReviewQueueDossierTestSuite() {
  console.log("\n📁 ================= STARTING REVIEW QUEUE & STUDENT DOSSIER TEST SUITE =================");

  // Clean setup
  db.resetDatabaseToZero(5059829001);

  // 1. Create test students with various document states
  const student1Id = 101010;
  const student2Id = 202020;
  const student3Id = 303030;

  db.getUser(student1Id, {
    fullName: "Jasur Alimov",
    phone: "+998901111111",
    preferredLevel: "Bachelor",
    isRegistered: true,
    isPremium: true,
    premiumTier: "Full Premium",
  });

  db.getUser(student2Id, {
    fullName: "Nodira Karimova",
    phone: "+998902222222",
    preferredLevel: "Master",
    isRegistered: true,
    isPremium: true,
    premiumTier: "Full Premium",
  });

  db.getUser(student3Id, {
    fullName: "Bobur Shokirov",
    phone: "+998903333333",
    preferredLevel: "Bachelor",
    isRegistered: true,
    isPremium: false,
    premiumTier: "Free",
  });

  // Student 1 submits passport and diploma
  db.submitDocument(student1Id, "passport", {
    fileName: "passport_jasur.pdf",
    fileType: "document",
    fileId: "file_pass_1",
  });
  db.submitDocument(student1Id, "diploma", {
    fileName: "diploma_jasur.pdf",
    fileType: "document",
    fileId: "file_dip_1",
  });
  // Student 1 also creates a degree application
  db.createApplication(
    student1Id,
    "prog-uw-cs",
    "Computer Science (BSc)",
    "University of Warsaw",
    "Warsaw"
  );

  // Student 2 submits photo and transcript
  db.submitDocument(student2Id, "photo", {
    fileName: "photo_nodira.jpg",
    fileType: "photo",
    fileId: "file_photo_2",
  });

  // 1. Review Queue Aggregation
  test("getStudentsWithDocumentsInQueue lists all students with uploaded documents grouped & sorted", () => {
    const queue = db.getStudentsWithDocumentsInQueue();
    assert.equal(queue.length, 2, "Should find 2 students with uploaded documents");

    // Student 1 has 2 pending docs, Student 2 has 1 pending doc -> Student 1 should be first
    assert.equal(queue[0].user.userId, student1Id);
    assert.equal(queue[0].pendingCount, 2);
    assert.equal(queue[0].totalUploadedCount, 2);

    assert.equal(queue[1].user.userId, student2Id);
    assert.equal(queue[1].pendingCount, 1);
    assert.equal(queue[1].totalUploadedCount, 1);
  });

  // 2. Full Dossier Check: Uploaded vs Missing documents & Degree Applications
  test("Student dossier accurately differentiates uploaded vs missing documents and links applications", () => {
    const student1 = db.getUser(student1Id);
    const docDefs = db.getDocumentDefinitions();
    const userDocs = student1.documents || {};
    const totalRequired = Object.keys(docDefs).length || 7;

    const uploadedDocs = Object.values(userDocs).filter(
      (d) => d.status === "reviewing" || d.status === "approved" || d.status === "needs_correction"
    );
    const missingDocs = Object.keys(docDefs).filter(
      (k) => !userDocs[k] || userDocs[k].status === "missing"
    );

    assert.equal(uploadedDocs.length, 2, "Uploaded count should be 2");
    assert.ok(uploadedDocs.some((d) => d.id === "passport"));
    assert.ok(uploadedDocs.some((d) => d.id === "diploma"));

    assert.equal(missingDocs.length, totalRequired - 2, "Missing count should be totalRequired - 2");
    assert.ok(missingDocs.includes("photo"), "Photo should be in missing list");
    assert.ok(missingDocs.includes("language"), "Language cert should be in missing list");

    // Applications check
    const apps = db.getUserApplications(student1Id);
    assert.equal(apps.length, 1);
    assert.equal(apps[0].university, "University of Warsaw");
    assert.equal(apps[0].programName, "Computer Science (BSc)");
  });

  // 3. Document Approval & Status Transition
  test("Admin approves single document -> status updates to approved and readiness metric increases", () => {
    db.verifyDocument(student1Id, "passport", "approved");

    const student1 = db.getUser(student1Id);
    assert.equal(student1.documents?.passport.status, "approved");
    assert.equal(student1.documents?.diploma.status, "reviewing");

    const queue = db.getStudentsWithDocumentsInQueue();
    const s1Entry = queue.find((q) => q.user.userId === student1Id);
    assert.ok(s1Entry);
    assert.equal(s1Entry?.approvedCount, 1);
    assert.equal(s1Entry?.pendingCount, 1);
  });

  // 4. Document Rejection with Feedback Note
  test("Admin requests correction with feedback note -> status updates to needs_correction", () => {
    const feedbackText = "Passport scan is blurred. Please send a clearer 300 DPI PDF scan.";
    db.verifyDocument(student1Id, "diploma", "needs_correction", feedbackText);

    const student1 = db.getUser(student1Id);
    assert.equal(student1.documents?.diploma.status, "needs_correction");
    assert.equal(student1.documents?.diploma.feedbackNote, feedbackText);

    const queue = db.getStudentsWithDocumentsInQueue();
    const s1Entry = queue.find((q) => q.user.userId === student1Id);
    assert.ok(s1Entry);
    assert.equal(s1Entry?.correctionCount, 1);
    assert.equal(s1Entry?.pendingCount, 0);
  });

  // 5. One-Click Approve All Student Documents
  test("approveAllStudentDocuments approves all remaining pending/correction documents at once", () => {
    // Add another document in reviewing state
    db.submitDocument(student1Id, "transcript", {
      fileName: "transcript_jasur.pdf",
      fileType: "document",
    });

    const studentBefore = db.getUser(student1Id);
    assert.equal(studentBefore.documents?.passport.status, "approved");
    assert.equal(studentBefore.documents?.diploma.status, "needs_correction");
    assert.equal(studentBefore.documents?.transcript.status, "reviewing");

    const adminId = 5059829001;
    const result = db.approveAllStudentDocuments(student1Id, adminId, "Super Admin");
    assert.equal(result.approvedCount, 2, "Should approve 2 non-approved documents");

    const studentAfter = db.getUser(student1Id);
    assert.equal(studentAfter.documents?.passport.status, "approved");
    assert.equal(studentAfter.documents?.diploma.status, "approved");
    assert.equal(studentAfter.documents?.transcript.status, "approved");
    assert.equal(studentAfter.documents?.diploma.feedbackNote, undefined);

    // Verify audit log
    const logs = db.getAuditLogs(5);
    const approveAllLog = logs.find((l) => l.action === "APPROVE_ALL_DOCUMENTS");
    assert.ok(approveAllLog);
    assert.equal(approveAllLog?.actorId, adminId);
  });

  console.log("\n🎉 ================= ALL 5/5 REVIEW QUEUE & DOSSIER TESTS PASSED! =================\n");
}

runReviewQueueDossierTestSuite();
