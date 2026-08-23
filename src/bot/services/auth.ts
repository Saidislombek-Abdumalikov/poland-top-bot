import * as crypto from "crypto";
import { config } from "../config";
import { db } from "./db";
import { AdminRole, UserSessionData, GhostSession } from "../types";

// SHA-256 password hashing helper
export function sha256Hash(secret: string): string {
  return crypto.createHash("sha256").update(secret.trim()).digest("hex");
}

// Default pre-computed SHA-256 hashes for system security:
// sha256("PTUADMIN2025") = "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b"
// sha256("super*admin")  = "524ebee4ea5727134ed3a89f4b14f5086bcdb822a718e3c1420d891c9efc4bc9"
const DEFAULT_ADMIN_HASH = "1de5c0b5b3fe90c0ce256712d7f84f1607e93f15282b7a3509463fa24d26225b";
const DEFAULT_SUPER_ADMIN_HASH = "524ebee4ea5727134ed3a89f4b14f5086bcdb822a718e3c1420d891c9efc4bc9";

// 12-hour admin session lifetime (in milliseconds)
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
// 2-hour ghost mode session lifetime
export const GHOST_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

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
  const superAdminHash =
    process.env.SUPER_ADMIN_PASSCODE_HASH ||
    (process.env.SUPER_ADMIN_PASSCODE
      ? sha256Hash(process.env.SUPER_ADMIN_PASSCODE)
      : DEFAULT_SUPER_ADMIN_HASH);

  if (verifySecret(cleanPasscode, superAdminHash)) {
    return "super_admin";
  }

  // 2. Check Normal Admin Hash
  const adminHash =
    process.env.ADMIN_PASSCODE_HASH ||
    (process.env.ADMIN_PASSCODE
      ? sha256Hash(process.env.ADMIN_PASSCODE)
      : DEFAULT_ADMIN_HASH);

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
  const user = db.getUser(userId);

  return db.updateUser(userId, {
    adminRole: role,
    isAdmin: true,
    isSuperAdmin: isSuper,
    adminSessionExpiresAt: expiresAt,
    sessionVersion: (user.sessionVersion || 1) + 1,
    ghostSession: null,
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
    isSuperAdmin: false,
    adminSessionExpiresAt: 0,
    sessionVersion: (user.sessionVersion || 1) + 1,
    ghostSession: null,
  });
}

/**
 * Grants Admin role to a target user server-side.
 */
export function grantAdminRole(
  targetUserId: number,
  actorId: number,
  isSuper: boolean = false
): UserSessionData {
  const targetUser = db.getUser(targetUserId);
  const updatedUser = db.updateUser(targetUserId, {
    isAdmin: true,
    isSuperAdmin: isSuper,
    adminRole: isSuper ? "super_admin" : "admin",
    adminSessionExpiresAt: Date.now() + SESSION_DURATION_MS,
    sessionVersion: (targetUser.sessionVersion || 1) + 1,
    ghostSession: null,
  });

  const actor = db.getUser(actorId);
  db.logAdminAction(
    actorId,
    actor.fullName || actor.username || `Admin #${actorId}`,
    "ADMIN_PERMISSION_GRANTED",
    `Granted ${isSuper ? "Super Admin" : "Normal Admin"} privileges to User #${targetUserId} (${targetUser.fullName || targetUser.username || "User"})`,
    targetUserId.toString(),
    "super_admin"
  );

  return updatedUser;
}

/**
 * Revokes Admin privileges from a user server-side with immediate session invalidation.
 */
export function revokeAdminRole(targetUserId: number, actorId: number): boolean {
  const targetUser = db.getUser(targetUserId);

  // Prevent demoting Super Admins
  if (targetUser.isSuperAdmin || targetUser.adminRole === "super_admin") {
    return false;
  }

  // Atomically strip all admin permissions and invalidate existing sessions
  db.updateUser(targetUserId, {
    isAdmin: false,
    isSuperAdmin: false,
    adminRole: null,
    adminSessionExpiresAt: 0,
    sessionVersion: (targetUser.sessionVersion || 1) + 1,
    ghostSession: null,
  });

  const actor = db.getUser(actorId);
  db.logAdminAction(
    actorId,
    actor.fullName || actor.username || `Admin #${actorId}`,
    "ADMIN_PERMISSION_REVOKED",
    `Revoked admin privileges from User #${targetUserId} (${targetUser.fullName || targetUser.username || "User"}). All sessions invalidated.`,
    targetUserId.toString(),
    "super_admin"
  );

  return true;
}

/**
 * Starts a privileged Ghost Mode session for Super Admin auditing.
 */
export function startGhostSession(
  superAdminId: number,
  targetAdminId: number
): GhostSession | null {
  if (!isAuthorizedSuperAdmin(superAdminId)) return null;

  const targetAdmin = db.getUser(targetAdminId);
  if (!targetAdmin.isAdmin && targetAdmin.adminRole !== "admin") {
    return null;
  }
  if (targetAdmin.isSuperAdmin || targetAdmin.adminRole === "super_admin") {
    return null; // Cannot ghost another Super Admin
  }

  const ghost: GhostSession = {
    actualSuperAdminId: superAdminId,
    actingAsAdminId: targetAdminId,
    actingAsAdminName: targetAdmin.fullName || targetAdmin.username || `Admin #${targetAdminId}`,
    enteredAt: Date.now(),
    expiresAt: Date.now() + GHOST_SESSION_DURATION_MS,
  };

  db.updateUser(superAdminId, {
    ghostSession: ghost,
    adminRole: "admin", // Sets acting interface to normal admin
  });

  db.logAdminAction(
    superAdminId,
    "Super Admin",
    "GHOST_MODE_ENTER",
    `Entered Ghost Mode acting as Admin #${targetAdminId} (${ghost.actingAsAdminName})`,
    targetAdminId.toString(),
    "super_admin"
  );

  return ghost;
}

/**
 * Exits Ghost Mode and safely restores Super Admin Master context.
 */
export function endGhostSession(superAdminId: number): boolean {
  const superUser = db.getUser(superAdminId);
  if (!superUser.ghostSession) return false;

  const targetId = superUser.ghostSession.actingAsAdminId;

  db.updateUser(superAdminId, {
    ghostSession: null,
    adminRole: "super_admin",
    isAdmin: true,
    isSuperAdmin: true,
  });

  db.logAdminAction(
    superAdminId,
    "Super Admin",
    "GHOST_MODE_EXIT",
    `Exited Ghost Mode (was acting as Admin #${targetId})`,
    targetId.toString(),
    "super_admin"
  );

  return true;
}

/**
 * Resolves the effective actor for any admin action (handling Ghost Mode auditability).
 */
export function getEffectiveActor(userId: number): {
  actorId: number;
  actingAsId: number;
  actorName: string;
  actorRole: "super_admin" | "admin";
  isGhost: boolean;
} {
  const user = db.getUser(userId);

  if (user.ghostSession) {
    if (Date.now() > user.ghostSession.expiresAt) {
      endGhostSession(userId);
    } else {
      return {
        actorId: user.ghostSession.actualSuperAdminId,
        actingAsId: user.ghostSession.actingAsAdminId,
        actorName: `Super Admin (Ghost as ${user.ghostSession.actingAsAdminName})`,
        actorRole: "super_admin",
        isGhost: true,
      };
    }
  }

  const isSuper = user.isSuperAdmin || user.adminRole === "super_admin";
  return {
    actorId: userId,
    actingAsId: userId,
    actorName: user.fullName || user.username || `Admin #${userId}`,
    actorRole: isSuper ? "super_admin" : "admin",
    isGhost: false,
  };
}

/**
 * Checks server-side if user has an active, valid Admin role (normal or super).
 */
export function isAuthorizedAdmin(userId?: number): boolean {
  if (!userId) return false;
  const user = db.getUser(userId);

  // Must have active admin flag or role
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
 * Note: When in Ghost Mode, Super Admin HQ access is suspended until exit to maintain isolation.
 */
export function isAuthorizedSuperAdmin(userId?: number): boolean {
  if (!userId) return false;
  const user = db.getUser(userId);

  // In Ghost Mode, Super Admin controls are suspended until exited
  if (user.ghostSession) {
    return false;
  }

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
