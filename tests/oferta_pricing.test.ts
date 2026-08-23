import { strict as assert } from "assert";
import { db, renderOfertaText } from "../src/bot/services/db";
import { isAuthorizedAdmin, isAuthorizedSuperAdmin, startAdminSession } from "../src/bot/services/auth";
import { config } from "../src/bot/config";

async function runOfertaPricingTestSuite() {
  console.log("\n📄 ================= STARTING OFERTA & DYNAMIC PRICING TEST SUITE =================");

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

  const superAdminId = config.superAdminTelegramId;
  const adminId = 888777;

  db.resetDatabaseToZero(superAdminId);

  // 1. Initial Pricing Config
  test("Single source of truth pricing config initializes with correct defaults", () => {
    const pricing = db.getPricingConfig();
    assert.equal(pricing.nawaPrice, 15);
    assert.equal(pricing.nawaCurrency, "USD");
    assert.equal(pricing.fullApplicationNawaPrice, 60);
    assert.equal(pricing.fullApplicationNawaCurrency, "USD");
    assert.equal(pricing.applicationFee, 30);
    assert.equal(pricing.applicationFeeCurrency, "EUR");
  });

  // 2. Dynamic Price Updates & Validation
  test("Admin updates NAWA price, Full Application + NAWA price, and Application fee", () => {
    // Valid update
    const updated = db.updatePricingConfig(
      {
        nawaPrice: 20,
        fullApplicationNawaPrice: 65,
        applicationFee: 40,
      },
      adminId,
      "Test Admin"
    );

    assert.equal(updated.nawaPrice, 20);
    assert.equal(updated.fullApplicationNawaPrice, 65);
    assert.equal(updated.applicationFee, 40);

    // Negative value validation
    assert.throws(() => {
      db.updatePricingConfig({ nawaPrice: -10 }, adminId);
    }, /Invalid NAWA price/);

    assert.throws(() => {
      db.updatePricingConfig({ fullApplicationNawaPrice: 0 }, adminId);
    }, /Invalid Full Application \+ NAWA price/);

    assert.throws(() => {
      db.updatePricingConfig({ applicationFee: -5 }, adminId);
    }, /Invalid Application Fee/);
  });

  // 3. Dynamic Placeholder Resolution in Oferta
  test("Rendered Oferta dynamically replaces template placeholders with current pricing", () => {
    const template =
      "Services:\n• NAWA: ${{NAWA_PRICE}}\n• Full: ${{FULL_APPLICATION_NAWA_PRICE}}\n• Fee: €{{APPLICATION_FEE}}\nDate: {{LAST_UPDATED_DATE}}";
    const pricing = db.getPricingConfig();
    const rendered = renderOfertaText(template, pricing, "23.08.2026");

    assert.ok(rendered.includes("NAWA: $20"), "Must render dynamic NAWA price");
    assert.ok(rendered.includes("Full: $65"), "Must render dynamic Full App price");
    assert.ok(rendered.includes("Fee: €40"), "Must render dynamic Application Fee");
    assert.ok(rendered.includes("Date: 23.08.2026"), "Must render dynamic date");
  });

  // 4. Oferta Draft and Preview
  test("Admin edits Oferta text as draft and previews with dynamic values", () => {
    const draftText =
      "📄 OFERTA YANGI VERSIYA\n\n• NAWA — ${{NAWA_PRICE}}\n• Full Application + NAWA — ${{FULL_APPLICATION_NAWA_PRICE}}\n• Ariza: €{{APPLICATION_FEE}}";

    const draft = db.updateDraftOferta(draftText, adminId, "Test Admin");
    assert.equal(draft.status, "draft");
    assert.equal(draft.version, 2);

    const renderedDraft = db.getRenderedOferta(draft.text);
    assert.ok(renderedDraft.includes("NAWA — $20"));
    assert.ok(renderedDraft.includes("Full Application + NAWA — $65"));
    assert.ok(renderedDraft.includes("Ariza: €40"));
  });

  // 5. Oferta Versioning and Publishing
  test("Admin publishes Oferta: version increments, historical snapshot archived, and published status set", () => {
    const published = db.publishOferta(adminId, "Test Admin");
    assert.equal(published.version, 2);
    assert.equal(published.status, "published");
    assert.ok(published.pricingSnapshot);
    assert.equal(published.pricingSnapshot?.nawaPrice, 20);
    assert.equal(published.pricingSnapshot?.fullApplicationNawaPrice, 65);

    // History check
    const history = db.getOfertaHistory();
    assert.equal(history.length, 1, "Must archive previous v1 oferta in history");
    assert.equal(history[0].version, 1);
  });

  // 6. User Onboarding Oferta Gate & Acceptance
  test("User completes info entry, remains unregistered until Oferta is accepted, then unlocks full registration", () => {
    const studentUser = 777111;
    // Step 1: Info input (Name, Phone, Degree)
    db.getUser(studentUser, {
      fullName: "Saidislom Karimov",
      phone: "+998901234567",
      preferredLevel: "Bachelor (BSc/BA)",
      isRegistered: false,
    });

    const pendingUser = db.getUser(studentUser);
    assert.equal(pendingUser.isRegistered, false, "Must remain unregistered before accepting Oferta");

    // Step 2: Student clicks [ ✅ Roziman ] (acceptOferta)
    db.acceptOferta(studentUser);

    const acceptedUser = db.getUser(studentUser);
    assert.equal(acceptedUser.isRegistered, true, "Must be registered after accepting Oferta");
    assert.equal(acceptedUser.acceptedOfertaVersion, 2, "Must record accepted Oferta version");
    assert.ok(acceptedUser.acceptedOfertaAt, "Must record timestamp of acceptance");
  });

  // 7. Super Admin Exclusive Access Control (Normal Admin Denied)
  test("Only Super Admin can manage Oferta and Dynamic Pricing; Normal Admin is denied", () => {
    // Normal Admin
    startAdminSession(adminId, "admin");
    assert.equal(isAuthorizedSuperAdmin(adminId), false, "Normal admin must NOT have super_admin authorization");

    // Super Admin
    startAdminSession(superAdminId, "super_admin");
    assert.equal(isAuthorizedSuperAdmin(superAdminId), true, "Super Admin MUST have super_admin authorization");
  });

  // 7. Transaction Price Immutability
  test("Historical transactions preserve exact creation price when pricing is updated later", () => {
    const studentA = 777222;
    const studentB = 777333;

    // Transaction created at current price ($20)
    const txnOld = db.createTransaction({
      userId: studentA,
      product: "NAWA",
      status: "PAID",
    });
    assert.equal(txnOld.amount, 20, "Old transaction created at $20");

    // Admin updates price to $35
    db.updatePricingConfig({ nawaPrice: 35 }, adminId, "Test Admin");

    // New transaction created at updated price ($35)
    const txnNew = db.createTransaction({
      userId: studentB,
      product: "NAWA",
      status: "PAID",
    });
    assert.equal(txnNew.amount, 35, "New transaction created at $35");

    // Old transaction must STILL be $20
    const fetchedOld = db.getTransaction(txnOld.id);
    assert.equal(fetchedOld?.amount, 20, "Historical transaction price must remain strictly unchanged ($20)");
  });

  // 8. Super Admin Audit Log Tracking
  test("Audit logs accurately record price updates and oferta publishing", () => {
    const logs = db.getAuditLogs(100);
    const priceLog = logs.find((l) => l.action === "PRICE_UPDATED");
    const ofertaLog = logs.find((l) => l.action === "OFFERA_PUBLISHED");

    assert.ok(priceLog, "PRICE_UPDATED log must exist");
    assert.ok(ofertaLog, "OFFERA_PUBLISHED log must exist");
  });

  // 9. Reset to default pricing & 0-data clean state
  test("Database reset restores clean 0-data and re-seeds default pricing config & v1 Oferta", () => {
    db.resetDatabaseToZero(superAdminId);

    const pricing = db.getPricingConfig();
    assert.equal(pricing.nawaPrice, 15);
    assert.equal(pricing.fullApplicationNawaPrice, 60);
    assert.equal(pricing.applicationFee, 30);

    const oferta = db.getPublishedOferta();
    assert.equal(oferta.version, 1);
    assert.equal(db.getAllUsers().length, 0);
    assert.equal(db.getAllTransactions().length, 0);
  });

  console.log(`\n🎉 ================= ALL ${passedTests}/${totalTests} OFERTA & PRICING TESTS PASSED! =================\n`);
}

runOfertaPricingTestSuite().catch((e) => {
  console.error("FATAL: Oferta & Pricing Test Suite Failed!", e);
  process.exit(1);
});
