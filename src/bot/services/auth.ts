import * as crypto from "crypto";
import { config } from "../config";
import { db } from "./db";
import { AdminRole, UserSessionData } from "../types";

// SHA-256 password hashing helper
export function sha256Hash(secret: string): string {
  return crypto.createHash("sha256").update(secret.trim()).digest("hex");
}

// Default pre-computed SHA-256 hashes for system security:
// sha256("PTUADMIN2025") = "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b"
// sha256("super*admin")  = "524ebee4ea5727134ed3a89f4b14f5086bcdb822a718e3c1420d891c9efc4bc9"
const DEFAULT_ADMIN_HASH = "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b";
const DEFAULT_SUPER_ADMIN_HASH = "524ebee4ea5727134ed3a89f4b14f5086bcdb822a718e3c1420d891c9efc4bc9";

// 12-hour session lifetime (in milliseconds)
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

/**
 * Constant-time hash verification to prevent timing attacks.
 */
export function verifySecret(inputSecret: string, targetHash: string): boolean {
  if (!inputSecret || !targetHash) return false;
  try {
    const inputHash = sha256Hash(inputSecret);
    const bufInput = Buffer.from(inputHash, "utf8");
    const bufTarget = Buffer.from(targetHash, "utf8");
    if (bufInput.length !== bufTarget.length) return false;
    return crypto.timingSafeEqual(bufInput, bufTarget);
  } catch {
    return false;
  }
}

/**
 * Authenticates provided passcode against hashed credentials.
 * Returns the matching role or null without exposing any details.
 */
export function authenticatePasscode(passcode: string): AdminRole | null {
  if (!passcode || typeof passcode !== "string") return null;
  const cleanPasscode = passcode.trim();
  if (!cleanPasscode) return null;

  // 1. Check Super Admin Hash
  const superAdminHash = process.env.SUPER_ADMIN_PASSCODE_HASH || 
    (process.env.SUPER_ADMIN_PASSCODE ? sha256Hash(process.env.SUPER_ADMIN_PASSCODE) : DEFAULT_SUPER_ADMIN_HASH);

  if (verifySecret(cleanPasscode, superAdminHash)) {
    return "super_admin";
  }

  // 2. Check Normal Admin Hash
  const adminHash = process.env.ADMIN_PASSCODE_HASH || 
    (process.env.ADMIN_PASSCODE ? sha256Hash(process.env.ADMIN_PASSCODE) : DEFAULT_ADMIN_HASH);

  if (verifySecret(cleanPasscode, adminHash)) {
    return "admin";
  }

  return null;
}

/**
 * Starts an authenticated admin session server-side.
 */
export function startAdminSession(userId: number, role: "admin" | "super_admin"): UserSessionData {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const isSuper = role === "super_admin";
  
  return db.updateUser(userId, {
    adminRole: role,
    isAdmin: true,
    isSuperAdmin: isSuper,
    adminSessionExpiresAt: expiresAt,
  });
}

/**
 * Clears an admin session server-side.
 */
export function endAdminSession(userId: number): UserSessionData {
  return db.updateUser(userId, {
    adminRole: null,
    isAdmin: false,
    isSuperAdmin: false,
    adminSessionExpiresAt: 0,
  });
}

/**
 * Checks server-side if user has an active, valid Admin role (normal or super).
 */
export function isAuthorizedAdmin(userId?: number): boolean {
  if (!userId) return false;
  const user = db.getUser(userId);
  if (!user.isAdmin && user.adminRole !== "admin" && user.adminRole !== "super_admin") {
    return false;
  }
  // Check session expiration if set
  if (user.adminSessionExpiresAt && Date.now() > user.adminSessionExpiresAt) {
    endAdminSession(userId);
    return false;
  }
  return true;
}

/**
 * Checks server-side if user has active, valid Super Admin role.
 */
export function isAuthorizedSuperAdmin(userId?: number): boolean {
  if (!userId) return false;
  const user = db.getUser(userId);
  if (!user.isSuperAdmin && user.adminRole !== "super_admin") {
    return false;
  }
  // Check session expiration if set
  if (user.adminSessionExpiresAt && Date.now() > user.adminSessionExpiresAt) {
    endAdminSession(userId);
    return false;
  }
  return true;
}

/**
 * Sanitizes any text before writing to audit logs or responses
 * to ensure credentials, tokens, or hashes are never leaked.
 */
export function sanitizeAuditText(text: string): string {
  if (!text) return "";
  let clean = text;
  // Replace potential password patterns
  const knownSecrets = [
    process.env.SUPER_ADMIN_PASSCODE,
    process.env.ADMIN_PASSCODE,
    "super*admin",
    "PTUADMIN2025",
    "superadminsaidislom*",
  ].filter(Boolean) as string[];

  for (const s of knownSecrets) {
    if (s.length >= 4) {
      clean = clean.split(s).join("[PROTECTED_CREDENTIAL]");
    }
  }

  // Sanitize Telegram bot tokens
  clean = clean.replace(/\d{8,10}:[A-Za-z0-9_-]{35}/g, "[PROTECTED_BOT_TOKEN]");
  return clean;
}
