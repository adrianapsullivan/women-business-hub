import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertQuizResultSchema,
  type FoundationProgressData,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const body = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByEmail(body.email);
      if (existing) {
        return res
          .status(409)
          .json({ message: "An account with this email already exists" });
      }
      const user = await storage.createUser(body);
      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: err.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      console.log("Login attempt:", email);
      console.log("Typed password:", password);
      console.log("Stored password:", user?.password);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/quiz/submit", async (req, res) => {
    const { userId, answers, dnaType, businessScores } = req.body as {
      userId?: string;
      answers: object;
      dnaType: string;
      businessScores?: object;
    };

    console.log("[quiz/submit] received — userId:", userId ?? "(none)", "dnaType:", dnaType);
    console.log("[quiz/submit] answers key count:", answers ? Object.keys(answers).length : 0);
    console.log("[quiz/submit] businessScores:", businessScores ? "present" : "absent");

    if (!dnaType || !answers) {
      console.error("[quiz/submit] missing required fields — dnaType:", dnaType, "answers:", !!answers);
      return res.status(400).json({ message: "dnaType and answers are required" });
    }

    try {
      const result = await storage.saveQuizResult(userId ?? null, dnaType, answers, businessScores);
      console.log("[quiz/submit] success — id:", result.id);
      return res.status(201).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[quiz/submit] FAILED —", msg);
      return res.status(500).json({ message: "Server error", detail: msg });
    }
  });

  app.get("/api/quiz/result/:userId", async (req, res) => {
    try {
      const result = await storage.getQuizResultByUserId(req.params.userId);
      if (!result) {
        return res.status(404).json({ message: "No result found" });
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/foundation/progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getFoundationProgress(req.params.userId);
      if (!progress) {
        return res.status(404).json({ message: "No progress found" });
      }
      return res.json(progress.data);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/foundation/progress", async (req, res) => {
    try {
      const { userId, ...data } = req.body as {
        userId: string;
      } & FoundationProgressData;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      const progress = await storage.saveFoundationProgress(
        userId,
        data as FoundationProgressData,
      );
      return res.json(progress.data);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/onboarding/progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getOnboardingProgress(req.params.userId);
      if (!progress) return res.status(404).json({ message: "No progress found" });
      return res.json(progress);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/onboarding/progress", async (req, res) => {
    try {
      const { userId, currentStep, completedSteps, dnaType, lastVisitedRoute, onboardingComplete, updatedAt } = req.body as {
        userId: string;
        currentStep: string;
        completedSteps: string[];
        dnaType: string;
        lastVisitedRoute: string;
        onboardingComplete: boolean;
        updatedAt: string;
      };
      if (!userId || !currentStep) {
        return res.status(400).json({ message: "userId and currentStep are required" });
      }
      await storage.saveOnboardingProgressData(userId, {
        currentStep,
        completedSteps: completedSteps ?? [],
        dnaType: dnaType ?? "",
        lastVisitedRoute: lastVisitedRoute ?? "",
        onboardingComplete: !!onboardingComplete,
        updatedAt: updatedAt ?? new Date().toISOString(),
      });
      return res.json({ ok: true });
    } catch (err) {
      console.error("[POST /api/onboarding/progress]", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(req.params.userId);
      if (!progress) {
        return res.status(404).json({ message: "No progress found" });
      }
      return res.json(progress);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const { userId, quizCompleted, reportUnlocked, pathType, onboardingCompleted } = req.body as {
        userId: string;
        quizCompleted?: boolean;
        reportUnlocked?: boolean;
        pathType?: string;
        onboardingCompleted?: boolean;
      };
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      await storage.saveUserProgress(userId, { quizCompleted, reportUnlocked, pathType, onboardingCompleted });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/progress/create", async (req, res) => {
    try {
      const { userId } = req.body as { userId: string };
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      await storage.createUserProgress(userId);
      return res.status(201).json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/mission/status/:userId", async (req, res) => {
    try {
      const status = await storage.getMissionStatus(req.params.userId);
      return res.json(status);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/mission/complete", async (req, res) => {
    try {
      const { userId, missionId } = req.body as { userId: string; missionId: string };
      if (!userId || !missionId) {
        return res.status(400).json({ message: "userId and missionId are required" });
      }
      const result = await storage.completeMission(userId, missionId);
      return res.json(result);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  /**
   * POST /api/auth/sync
   * Idempotent — safe to call on every login / session restore.
   * 1. Ensures a row exists in public.users for this Supabase Auth user.
   * 2. If the user has quiz data (dnaType), ensures a quiz_results row exists.
   * Returns { ok, hasQuizResult } so the client can patch auth metadata if needed.
   */
  app.post("/api/auth/sync", async (req, res) => {
    const { userId, email, firstName, dnaType, answers } = req.body as {
      userId:    string;
      email:     string;
      firstName?: string;
      dnaType?:  string;
      answers?:  object;
    };

    console.log("[sync] sync started");
    console.log("[sync] auth user id:", userId);

    if (!userId || !email) {
      return res.status(400).json({ ok: false, message: "userId and email are required" });
    }

    // ── Step 1: ensure public.users row ──────────────────────────────────────
    try {
      await storage.ensureUserRow(userId, email, firstName, dnaType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[sync] sync failed — table: users —", msg);
      return res.status(500).json({ ok: false, failedTable: "users", error: msg });
    }

    // ── Step 2: ensure quiz_results row ──────────────────────────────────────
    let hasQuizResult = false;
    try {
      if (dnaType) {
        await storage.ensureQuizResult(userId, dnaType, answers);
        hasQuizResult = true;
      } else {
        const existing = await storage.getQuizResultByUserId(userId);
        hasQuizResult = !!existing;
        if (hasQuizResult) {
          console.log("[sync] quiz_results exists for user_id:", userId);
        } else {
          console.log("[sync] no quiz_results found — dnaType not provided, skipping insert");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[sync] sync failed — table: quiz_results —", msg);
      return res.status(500).json({ ok: false, failedTable: "quiz_results", error: msg });
    }

    console.log("[sync] sync complete — userId:", userId, "hasQuizResult:", hasQuizResult);
    return res.json({ ok: true, hasQuizResult });
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const { name, email, dnaType } = req.body as {
        name: string;
        email: string;
        dnaType: string;
      };
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      const result = await storage.addToWaitlist({ name, email, dnaType: dnaType || "Unknown" });
      return res.status(result.alreadyExists ? 200 : 201).json({
        message: result.alreadyExists
          ? "You are already on the Empire Waitlist."
          : "You are now on the Empire Waitlist.",
        position: result.position,
        alreadyExists: result.alreadyExists,
      });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/waitlist/count", async (_req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      return res.json({ count });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
