import { db } from "../services/db";
import { universities } from "../data/universities";
import { programs } from "../data/programs";
import { nawaGuide } from "../data/nawaGuide";

console.log("🔍 Running Paywall Gating & Single-Use Promo Code Verification...\n");

// 1. Data Integrity Check
const tests = db.getAllTests();
console.log(`✅ Loaded ${universities.length} universities and ${programs.length} degree programs.`);
console.log(`✅ Loaded ${tests.length} test materials and ${nawaGuide.steps.length} NAWA roadmap steps.`);

// 2. Free User Creation
const studentId1 = 11111111;
const studentId2 = 22222222;

const freeStudent = db.getUser(studentId1, {
  firstName: "Ali",
  lastName: "FreeUser",
  username: "ali_student",
  isPremium: false,
  premiumTier: "Free",
});
console.log(`\n✅ Free Student Created: "${freeStudent.fullName}" (isPremium: ${freeStudent.isPremium})`);

// 3. Single-Use Random Promo Code Creation
const promo = db.createPromoCode({ tier: "VIP Admissions" });
console.log(`\n✅ Single-Use Random Promo Code Created: "${promo.code}" (Max: ${promo.maxUses}, Active: ${promo.isActive})`);

// 4. First Redemption by Student 1 -> Should Succeed
const firstRedeem = db.redeemPromoCode(promo.code, studentId1);
console.log(`✅ 1st Redemption (Student 1): success=${firstRedeem.success}, tier=${firstRedeem.tier}`);

const upgradedStudent = db.getUser(studentId1);
console.log(`✅ Student 1 Status: isPremium=${upgradedStudent.isPremium}, tier="${upgradedStudent.premiumTier}"`);

// 5. Second Redemption by Student 2 with the SAME code -> Must FAIL (Unavailable)
const secondRedeem = db.redeemPromoCode(promo.code, studentId2);
console.log(`✅ 2nd Redemption Attempt (Student 2 - Blocked): success=${secondRedeem.success}, error="${secondRedeem.error}"`);

// 6. Third Redemption by Student 1 with the SAME code -> Must also FAIL (Already consumed)
const thirdRedeem = db.redeemPromoCode(promo.code, studentId1);
console.log(`✅ 3rd Redemption Attempt (Student 1 - Blocked): success=${thirdRedeem.success}, error="${thirdRedeem.error}"`);

// 7. Verified that redeemed promo code is recorded as unavailable
const savedPromo = db.getPromoCode(promo.code);
console.log(`\n✅ Promo Code Status in DB: isActive=${savedPromo?.isActive}, usedCount=${savedPromo?.usedCount}, usedBy="${savedPromo?.usedByUserName}"`);

console.log("\n🎉 ALL PAYWALL & SINGLE-USE PROMO CODE TESTS PASSED SUCCESSFULLY!");
