import * as crypto from "crypto";
import { config } from "../config";
import { db } from "./db";
import { UserSessionData } from "../types";

// SHA-256 password hashing helper
export function sha256Hash(secret: string): string {
  return crypto.createHash("sha256").update(secret.trim()).digest("hex");
}

// Default pre-computed SHA-256 hash for PTUADMIN2025
const DEFAULT_ADMIN_HASH = "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b";

// 12-hour admin session lifetime (in milliseconds)
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
 * Returns true if valid admin passcode, false otherwise.
 */
export function authenticatePasscode(passcode: string): boolean {
  if (!passcode || typeof passcode !== "string") return false;
  const cleanPasscode = passcode.trim().toUpperCase();
  if (!cleanPasscode) return false;

  // Support both ADMINPTU and PTUADMIN2025
  if (cleanPasscode === "ADMINPTU" || cleanPasscode === "PTUADMIN2025") {
    return true;
  }

  const adminHash =
    process.env.ADMIN_PASSCODE_HASH ||
    (config.adminPasscode ? sha256Hash(config.adminPasscode) : DEFAULT_ADMIN_HASH);

  return verifySecret(cleanPasscode, adminHash);
}

/**
 * Starts an authenticated admin session server-side.
 */
export function startAdminSession(userId: number): UserSessionData {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const user = db.getUser(userId);

  return db.updateUser(userId, {
    adminRole: "admin",
    isAdmin: true,
    adminSessionExpiresAt: expiresAt,
    sessionVersion: (user.sessionVersion || 1) + 1,
  });
}

/**
 * Clears an admin session server-side.
 */
export function endAdminSession(userId: number): UserSessionData {
  const user = db.getUser(userId);
  return db.updateUser(userId, {
    adminRole: null,
    isAdmin: false,
    adminSessionExpiresAt: 0,
    sessionVersion: (user.sessionVersion || 1) + 1,
  });
}

/**
 * Grants Admin role to a target user server-side.
 */
export function grantAdminRole(targetUserId: number): UserSessionData {
  const targetUser = db.getUser(targetUserId);
  return db.updateUser(targetUserId, {
    isAdmin: true,
    adminRole: "admin",
    adminSessionExpiresAt: Date.now() + SESSION_DURATION_MS,
    sessionVersion: (targetUser.sessionVersion || 1) + 1,
  });
}

/**
 * Revokes Admin privileges from a user server-side.
 */
export function revokeAdminRole(targetUserId: number): boolean {
  db.updateUser(targetUserId, {
    isAdmin: false,
    adminRole: null,
    adminSessionExpiresAt: 0,
  });
  return true;
}

/**
 * Checks server-side if user has an active, valid Admin role.
 */
export function isAuthorizedAdmin(userId?: number): boolean {
  if (!userId) return false;

  // Direct whitelist check
  if (config.adminIds && config.adminIds.includes(userId)) {
    return true;
  }

  const user = db.getUser(userId);

  // Must have active admin flag or role
  if (!user.isAdmin && user.adminRole !== "admin") {
    return false;
  }

  // Check session expiration if set
  if (user.adminSessionExpiresAt && Date.now() > user.adminSessionExpiresAt) {
    endAdminSession(userId);
    return false;
  }

  return true;
}
