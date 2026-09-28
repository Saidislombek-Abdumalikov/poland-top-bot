import { Bot, GrammyError, HttpError } from "grammy";
import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";
import { config, validateConfig } from "./config";
import { db } from "./services/db";
import { isAuthorizedAdmin, authenticatePasscode, startAdminSession } from "./services/auth";
import { programs } from "./data/programs";
import { AppStage, DocStatus } from "./types";
import { escapeHtml } from "./utils/format";
import { setupStartHandler } from "./handlers/startHandler";
import { setupTextInputHandler } from "./handlers/textInputHandler";

let activeBotInstance: Bot | null = null;

export function createBot(token?: string) {
  const activeToken = token || config.botToken;

  if (!activeToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN. Please provide a valid token from @BotFather.");
  }

  const bot = new Bot(activeToken);
  activeBotInstance = bot;

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

  // Setup lean onboarding handlers (all other interactions live in Mini App)
  setupStartHandler(bot);
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
        age: user.age,
        hasPassport: user.hasPassport,
        budget: user.budget,
        preferredField: user.preferredField,
        englishLevel: user.englishLevel,
        polishLevel: user.polishLevel,
        mathLevel: user.mathLevel,
        hasSat: user.hasSat,
        interests: user.interests,
        targetIntake: user.targetIntake,
      },
    });
  });

  app.post("/api/user/onboard", (req, res) => {
    const { userId, ...onboardingData } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const user = db.getUser(Number(userId));
    
    // Save onboarding data
    Object.assign(user, onboardingData);
    user.isRegistered = true; // Mark as registered upon completing onboarding
    if(!user.registeredAt) user.registeredAt = new Date().toISOString();
    
    db.saveDatabase();
    res.json({ success: true, user });
  });

  app.get("/api/universities", (_req, res) => {
    const rawUnis = db.getAllUniversities();
    
    // Sort from best to lowest based on a predefined order
    const order = ["uw", "uj", "pw", "agh", "pwr", "amu", "sgh", "kozminski", "swps", "pg", "pjatk"];
    rawUnis.sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    const mappedUnis = rawUnis.map((u) => ({
      id: u.id,
      name: u.name,
      city: u.city,
      ranking: u.ranking || "",
      description: u.description || { uz: "", en: "" },
      tuitionRange:
        typeof u.tuition === "object"
          ? u.tuition?.english || u.tuition?.nonEu || "€2,500 / yil"
          : String(u.tuition || "€2,500 / yil"),
      popularFaculties: Array.isArray(u.faculties) ? u.faculties : [],
      intake: u.deadline || "Oktyabr 2026",
      websiteUrl: u.website || "",
      imageUrl: u.logo || "",
    }));
    res.json({ universities: mappedUnis });
  });

  app.get("/api/programs", (_req, res) => {
    const mappedPrograms = programs.map((p) => {
      const isMaster = (p.level || "").toLowerCase().includes("master");
      const durationNum = p.duration ? parseInt(p.duration.replace(/\D/g, ""), 10) || 3 : 3;
      return {
        id: p.id,
        name: p.name,
        degree: isMaster ? "master" : "bachelor",
        universityId: p.uniId || "uw",
        universityName: p.university || "Poland University",
        tuitionFee: p.tuition || "€2,500 / yil",
        durationYears: durationNum,
        language: p.lang || "English",
        faculty: p.field || "General Studies",
        description:
          typeof p.about === "object"
            ? p.about?.uz || p.about?.en || ""
            : String(p.about || ""),
      };
    });
    res.json({ programs: mappedPrograms });
  });

  app.get("/api/documents", (req, res) => {
    const userId = Number(req.query.userId);
    if (userId) {
      const userDocs = db.getUserDocuments(userId);
      const mapped = Object.entries(userDocs).map(([key, d]) => ({
        id: d.id || key,
        userId,
        docType: key,
        status: d.status || "pending",
        fileUrl: d.link || d.fileId || "",
        feedback: d.feedbackNote || "",
        updatedAt: d.updatedAt || "",
      }));
      res.json({ documents: mapped });
    } else {
      const allDocs: any[] = [];
      db.getAllUsers().forEach((u) => {
        if (u.documents) {
          Object.entries(u.documents).forEach(([key, d]) => {
            allDocs.push({
              id: d.id || key,
              userId: u.userId,
              docType: key,
              status: d.status || "pending",
              fileUrl: d.link || d.fileId || "",
              feedback: d.feedbackNote || "",
              updatedAt: d.updatedAt || "",
              studentName: u.fullName,
            });
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
    res.json({
      success: true,
      document: {
        id: saved.id || docType,
        userId: Number(userId),
        docType,
        status: saved.status || "reviewing",
        fileUrl: saved.link || fileUrl || "",
        feedback: saved.feedbackNote || "",
        updatedAt: saved.updatedAt || new Date().toISOString(),
      },
    });
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

  // Admin Authentication & Login
  app.post("/api/admin/login", (req, res) => {
    const { passcode, userId } = req.body;
    const valid = authenticatePasscode(passcode);
    if (valid && userId) {
      startAdminSession(Number(userId));
    }
    res.json({ success: valid });
  });

  // Admin CRM APIs
  app.get("/api/admin/stats", (_req, res) => {
    const totalStudents = db.getUserCount();
    const totalApplications = db.getAllApplications().length;
    const pendingDocs = db.getPendingDocuments().length;
    const acceptedStudents = db.getAllApplications().filter((a) => a.stage === "Accepted").length;
    res.json({ totalStudents, totalApplications, pendingDocs, acceptedStudents });
  });

  app.get("/api/admin/users", (_req, res) => {
    const users = db.getAllUsers().map((u) => ({
      id: u.userId,
      userId: u.userId,
      fullName: u.fullName || u.firstName || "Student",
      username: u.username || "",
      phone: u.phone || "",
      preferredLevel: u.preferredLevel || "Bachelor",
      isRegistered: u.isRegistered,
      acceptedOfertaAt: u.acceptedOfertaAt,
      registeredAt: u.registeredAt,
    }));
    res.json({ users });
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

  app.post("/api/admin/universities", (req, res) => {
    const { id, name, city, tuitionRange, popularFaculties } = req.body;
    const uniId = id || `uni-${Date.now()}`;
    const saved = db.saveUniversity({
      id: uniId,
      name,
      city: city || "Warsaw",
      tuition: {
        eu: tuitionRange || "€2,500 / yil",
        nonEu: tuitionRange || "€2,500 / yil",
        english: tuitionRange || "€2,500 / yil",
      },
      faculties: Array.isArray(popularFaculties) ? popularFaculties : ["General Studies"],
      ranking: "Accredited Polish University",
      abbr: uniId.toUpperCase().slice(0, 4),
      type: "Public",
      founded: 2000,
      website: "https://polandstudy.org",
      programsCount: 10,
      students: 3000,
      internationalStudents: 400,
      logo: "PL",
      description: { en: name, uz: name },
      requirements: ["High School Diploma", "Language Certificate"],
      deadline: "Oktyabr 2026",
    });
    res.json({ success: true, university: saved });
  });

  app.delete("/api/admin/universities/:id", (req, res) => {
    const success = db.deleteUniversity(req.params.id);
    res.json({ success });
  });

  app.get("/api/admin/oferta", (_req, res) => {
    res.json({ text: db.getRenderedOferta() });
  });

  app.post("/api/admin/oferta", (req, res) => {
    const { text, publisherName } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });
    const updated = db.updateOferta(text, publisherName || "Admin");
    res.json({ success: true, oferta: updated });
  });

  // Admin Broadcast Message to all students
  app.post("/api/admin/broadcast", async (req, res) => {
    const { message } = req.body;
    if (!message || !activeBotInstance) {
      return res.status(400).json({ error: "Missing message or bot not ready" });
    }

    const users = db.getAllUsers().filter((u) => u.userId);
    let sentCount = 0;
    for (const u of users) {
      try {
        await activeBotInstance.api.sendMessage(
          u.userId,
          `📢 <b>E'LON / ANNOUNCEMENT:</b>\n\n${escapeHtml(message)}`,
          { parse_mode: "HTML" }
        );
        sentCount++;
      } catch (err) {
        // Ignore blocked
      }
    }
    res.json({ success: true, sentCount, totalUsers: users.length });
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
      console.log("🇵🇱 Poland Top Universities Bot & Mini App Portal ready!");
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
