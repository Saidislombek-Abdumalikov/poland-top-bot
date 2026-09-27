import { Bot, GrammyError, HttpError } from "grammy";
import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";
import { config, validateConfig } from "./config";
import { db } from "./services/db";
import { isAuthorizedAdmin } from "./services/auth";
import { programs } from "./data/programs";
import { AppStage, DocStatus } from "./types";
import { setupStartHandler } from "./handlers/startHandler";
import { setupUniversityHandler } from "./handlers/universityHandler";
import { setupProgramHandler } from "./handlers/programHandler";
import { setupDocumentHandler } from "./handlers/documentHandler";
import { setupExamHandler } from "./handlers/examHandler";
import { setupProfileHandler } from "./handlers/profileHandler";
import { setupTextInputHandler } from "./handlers/textInputHandler";
import { setupAdminHandler } from "./handlers/adminHandler";
import { setupReviewHandler } from "./handlers/reviewHandler";

export function createBot(token?: string) {
  const activeToken = token || config.botToken;

  if (!activeToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN. Please provide a valid token from @BotFather.");
  }

  const bot = new Bot(activeToken);

  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Grammy error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  // Setup all feature handlers
  setupAdminHandler(bot);
  setupStartHandler(bot);
  setupUniversityHandler(bot);
  setupProgramHandler(bot);
  setupDocumentHandler(bot);
  setupExamHandler(bot);
  setupReviewHandler(bot);
  setupProfileHandler(bot);
  setupTextInputHandler(bot);

  // Version/Health command for instant verification
  bot.command(["version", "ping"], async (ctx) => {
    await ctx.reply(
      `🤖 <b>PTU Bot System Status: ONLINE</b>\n` +
        `• 🏷️ <b>Version:</b> 2.0.0 (Clean Architecture & Mini App)\n` +
        `• ⚡ <b>Response:</b> Operational\n` +
        `• 🗄️ <b>Database:</b> Cloud Sync Active`,
      { parse_mode: "HTML" }
    );
  });

  return bot;
}

export function createServerApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      bot: "Poland Top Universities (PTU) Telegram Bot & Mini App",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // REST API Routes
  app.get("/api/user", (req, res) => {
    const userId = Number(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const user = db.getUser(userId);
    const isAdmin = isAuthorizedAdmin(userId) || Boolean(user.isAdmin);
    res.json({
      user: {
        id: user.userId,
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        lang: user.lang,
        isRegistered: user.isRegistered,
        isAdmin,
        preferredLevel: user.preferredLevel,
        acceptedOfertaAt: user.acceptedOfertaAt
          ? new Date(user.acceptedOfertaAt).getTime()
          : undefined,
      },
    });
  });

  app.get("/api/universities", (_req, res) => {
    res.json({ universities: db.getAllUniversities() });
  });

  app.get("/api/programs", (_req, res) => {
    res.json({ programs });
  });

  app.get("/api/documents", (req, res) => {
    const userId = Number(req.query.userId);
    if (userId) {
      const userDocs = db.getUserDocuments(userId);
      res.json({ documents: Object.values(userDocs) });
    } else {
      const allDocs: any[] = [];
      db.getAllUsers().forEach((u) => {
        if (u.documents) {
          Object.values(u.documents).forEach((d) => {
            allDocs.push({ ...d, userId: u.userId, studentName: u.fullName });
          });
        }
      });
      res.json({ documents: allDocs });
    }
  });

  app.post("/api/documents/upload", async (req, res) => {
    const { userId, docType, fileUrl } = req.body;
    if (!userId || !docType) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const saved = await db.saveUserDocument(Number(userId), docType, {
      link: fileUrl || `https://storage.polandtop.uz/docs/${userId}_${docType}.pdf`,
      fileType: "link",
    });
    res.json({ success: true, document: saved });
  });

  app.get("/api/applications", (req, res) => {
    const userId = Number(req.query.userId);
    const applications = userId ? db.getUserApplications(userId) : db.getAllApplications();
    res.json({ applications });
  });

  app.post("/api/applications/apply", (req, res) => {
    const { userId, programId } = req.body;
    if (!userId || !programId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = db.getUser(Number(userId));
    const prog = programs.find((p) => p.id === programId);

    const appRecord = db.createApplication({
      userId: Number(userId),
      programId,
      programName: prog ? prog.name : programId,
      university: prog ? prog.university : "Poland University",
      city: prog ? prog.city : "Poland",
      stage: "Submitted",
      studentName: user.fullName || user.firstName || "Student",
    });

    res.json({ success: true, application: appRecord });
  });

  app.get("/api/tests", (_req, res) => {
    const tests = db.getAllTests();
    res.json({ tests });
  });

  app.get("/api/reviews", (_req, res) => {
    res.json({ reviews: db.getAllReviews() });
  });

  app.post("/api/reviews/add", (req, res) => {
    const { userId, studentName, rating, universityName, programName, comment } = req.body;
    if (!userId || !comment) {
      return res.status(400).json({ error: "Missing review content" });
    }
    const review = db.addReview({
      userId: Number(userId),
      name: studentName || "Student",
      country: "Uzbekistan",
      rating: Number(rating) || 5,
      university: universityName || "Poland University",
      program: programName || "Academic Program",
      year: "2026",
      text: {
        uz: String(comment),
        en: String(comment),
      },
      status: "approved",
    });
    res.json({ success: true, review });
  });

  // Admin CRM APIs
  app.get("/api/admin/stats", (_req, res) => {
    const totalStudents = db.getUserCount();
    const totalApplications = db.getAllApplications().length;
    const pendingDocs = db.getPendingDocuments().length;
    const acceptedStudents = db.getAllApplications().filter((a) => a.stage === "Accepted").length;
    res.json({ totalStudents, totalApplications, pendingDocs, acceptedStudents });
  });

  app.get("/api/admin/applications", (_req, res) => {
    res.json({ applications: db.getAllApplications() });
  });

  app.get("/api/admin/documents", (_req, res) => {
    const pending = db.getPendingDocuments().map((item) => ({
      ...item.doc,
      userId: item.userId,
      studentName: item.user.fullName,
    }));
    res.json({ documents: pending });
  });

  app.post("/api/admin/applications/:id/stage", (req, res) => {
    const { stage, counselorNotes } = req.body;
    const updated = db.updateApplicationStage(req.params.id, stage as AppStage, counselorNotes);
    res.json({ success: Boolean(updated) });
  });

  app.post("/api/admin/documents/:id/status", (req, res) => {
    const { userId, docKey, status, feedback } = req.body;
    const targetUserId = Number(userId || req.params.id);
    const updated = db.updateDocumentStatus(targetUserId, docKey || "passport", status as DocStatus, feedback);
    res.json({ success: Boolean(updated) });
  });

  // Serve static assets from dist/ if built
  const distDir = path.resolve(process.cwd(), "dist");
  app.use(express.static(distDir));

  // Catch-all SPA route
  app.get("*", (_req, res) => {
    const indexPath = path.join(distDir, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.json({ status: "ok", message: "PTU Mini App is initializing" });
    }
  });

  return app;
}

export async function startBot(token?: string) {
  validateConfig();
  const activeToken = token || config.botToken;

  if (!activeToken) {
    console.error("❌ Cannot start Telegram Bot: BOT_TOKEN is missing.");
    console.log("👉 How to fix: Set BOT_TOKEN in your .env file or run with BOT_TOKEN=your_token");
    return;
  }

  // Start Express API & Mini App Static server
  const port = Number(process.env.PORT) || 10000;
  const app = createServerApp();
  app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 PTU Express WebApp & API Server active on 0.0.0.0:${port}`);
  });

  const bot = createBot(activeToken);

  console.log("🚀 Starting Poland Top Universities (PTU) Telegram Bot...");

  // Clear any existing webhook so local long-polling can start without 409 conflict
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
  } catch (e) {
    // Ignore
  }

  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ PTU Bot is running as @${botInfo.username} (ID: ${botInfo.id})`);
      console.log("🇵🇱 Universities, Programs, Exams & Document Tracker ready!");
    },
  });
}

// Auto-run only if executed directly via npm run bot or tsx src/bot/index.ts
const isDirectRun =
  process.env.npm_lifecycle_event === "bot" ||
  process.env.npm_lifecycle_event === "bot:dev" ||
  (Boolean(process.argv[1]) &&
    (process.argv[1].endsWith("src/bot/index.ts") ||
      process.argv[1].endsWith("src\\bot\\index.ts") ||
      process.argv[1].endsWith("src/bot/index.js") ||
      process.argv[1].endsWith("src\\bot\\index.js")));

if (isDirectRun) {
  startBot();
}
