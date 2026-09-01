import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  type FoundationProgressData,
} from "@shared/schema";
import {
  getAuthenticatedUser,
  requireSupabaseUser,
} from "./request-auth";
import {
  DnaResultAccessError,
  DnaResultConflictError,
  DnaResultValidationError,
  createDnaResultService,
  type StoredDnaResult,
} from "./dna-result-service";
import { supabaseDnaResultRepository } from "./dna-result-storage";

const RETIRED_PASSWORD_AUTH_MESSAGE =
  "Legacy password authentication is retired; use Supabase Auth";
const V2_PERSISTENCE_UNAVAILABLE_MESSAGE =
  "Entrepreneur DNA V2 persistence is not available";
const WAITLIST_UNAVAILABLE_MESSAGE = "Waitlist registration is not available";
const V2_PERSISTENCE_ENABLED = false;
const REPORT_ACCESS_COOKIE = "wbe_dna_report_access";
const dnaResultService = createDnaResultService({
  repository: supabaseDnaResultRepository,
});

function rejectMismatchedUserId(
  suppliedUserId: string | string[],
  authenticatedUserId: string,
): boolean {
  return (
    Array.isArray(suppliedUserId) || suppliedUserId !== authenticatedUserId
  );
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    const cookieName = item.slice(0, separator).trim();
    if (cookieName !== name) continue;
    try {
      return decodeURIComponent(item.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function setReportAccessCookie(
  res: Response,
  reportAccessToken: string,
  expiresAt: string,
): void {
  res.cookie(REPORT_ACCESS_COOKIE, reportAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

function toDnaResultResponse(record: StoredDnaResult) {
  return {
    resultId: record.id,
    firstName: record.firstName,
    result: record.resultPayload,
    claimed: record.ownerUserId !== null,
  };
}

function sendDnaResultError(res: Response, error: unknown) {
  if (
    error instanceof DnaResultValidationError ||
    error instanceof DnaResultConflictError ||
    error instanceof DnaResultAccessError
  ) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("[dna/v2] request failed", error);
  return res.status(500).json({ message: "Server error" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.post("/api/auth/signup", (_req, res) => {
    return res.status(410).json({ message: RETIRED_PASSWORD_AUTH_MESSAGE });
  });

  app.post("/api/auth/login", (_req, res) => {
    return res.status(410).json({ message: RETIRED_PASSWORD_AUTH_MESSAGE });
  });

  app.post("/api/dna/v2/results", (_req, res) => {
    return res.status(503).json({
      message: V2_PERSISTENCE_UNAVAILABLE_MESSAGE,
    });
  });

  app.get("/api/dna/v2/report", async (req, res) => {
    const reportAccessToken = readCookie(
      req.header("cookie"),
      REPORT_ACCESS_COOKIE,
    );
    if (!reportAccessToken || !V2_PERSISTENCE_ENABLED) {
      return res.status(404).json({ message: "DNA result not found" });
    }
    try {
      const record = await dnaResultService.readAnonymousResult(
        reportAccessToken,
      );
      return res.json(toDnaResultResponse(record));
    } catch (error) {
      return sendDnaResultError(res, error);
    }
  });

  app.post("/api/dna/v2/claim", requireSupabaseUser, async (req, res) => {
    if (!V2_PERSISTENCE_ENABLED) {
      return res.status(503).json({
        message: V2_PERSISTENCE_UNAVAILABLE_MESSAGE,
      });
    }
    const reportAccessToken = readCookie(
      req.header("cookie"),
      REPORT_ACCESS_COOKIE,
    );
    if (!reportAccessToken) {
      return res.status(404).json({ message: "DNA result not found" });
    }
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      const record = await dnaResultService.claimResult({
        reportAccessToken,
        authenticatedUserId: authenticatedUser.id,
        authenticatedEmail: authenticatedUser.email,
      });
      return res.json(toDnaResultResponse(record));
    } catch (error) {
      return sendDnaResultError(res, error);
    }
  });

  app.get(
    "/api/dna/v2/member-result",
    requireSupabaseUser,
    async (req, res) => {
      if (!V2_PERSISTENCE_ENABLED) {
        return res.status(503).json({
          message: V2_PERSISTENCE_UNAVAILABLE_MESSAGE,
        });
      }
      try {
        const authenticatedUser = getAuthenticatedUser(req);
        const record = await dnaResultService.readMemberResult(
          authenticatedUser.id,
        );
        return res.json(toDnaResultResponse(record));
      } catch (error) {
        return sendDnaResultError(res, error);
      }
    },
  );

  app.post("/api/quiz/submit", requireSupabaseUser, async (req, res) => {
    const authenticatedUser = getAuthenticatedUser(req);
    const { userId, answers, dnaType, businessScores } = req.body as {
      userId?: string;
      answers: object;
      dnaType: string;
      businessScores?: object;
    };

    if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    console.log("[quiz/submit] received — authenticated userId:", authenticatedUser.id, "dnaType:", dnaType);
    console.log("[quiz/submit] answers key count:", answers ? Object.keys(answers).length : 0);
    console.log("[quiz/submit] businessScores:", businessScores ? "present" : "absent");

    if (!dnaType || !answers) {
      console.error("[quiz/submit] missing required fields — dnaType:", dnaType, "answers:", !!answers);
      return res.status(400).json({ message: "dnaType and answers are required" });
    }

    try {
      const result = await storage.saveQuizResult(authenticatedUser.id, dnaType, answers, businessScores);
      console.log("[quiz/submit] success — id:", result.id);
      return res.status(201).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[quiz/submit] FAILED —", msg);
      return res.status(500).json({ message: "Server error", detail: msg });
    }
  });

  app.get("/api/quiz/result/:userId", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (rejectMismatchedUserId(req.params.userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const result = await storage.getQuizResultByUserId(authenticatedUser.id);
      if (!result) {
        return res.status(404).json({ message: "No result found" });
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/foundation/progress/:userId", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (rejectMismatchedUserId(req.params.userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const progress = await storage.getFoundationProgress(authenticatedUser.id);
      if (!progress) {
        return res.status(404).json({ message: "No progress found" });
      }
      return res.json(progress.data);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/foundation/progress", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      const { userId, ...data } = req.body as {
        userId?: string;
      } & FoundationProgressData;
      if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const progress = await storage.saveFoundationProgress(
        authenticatedUser.id,
        data as FoundationProgressData,
      );
      return res.json(progress.data);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/onboarding/progress/:userId", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (rejectMismatchedUserId(req.params.userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const progress = await storage.getOnboardingProgress(authenticatedUser.id);
      if (!progress) return res.status(404).json({ message: "No progress found" });
      return res.json(progress);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/onboarding/progress", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      const { userId, currentStep, completedSteps, dnaType, lastVisitedRoute, onboardingComplete, updatedAt } = req.body as {
        userId?: string;
        currentStep: string;
        completedSteps: string[];
        dnaType: string;
        lastVisitedRoute: string;
        onboardingComplete: boolean;
        updatedAt: string;
      };
      if (!currentStep) {
        return res.status(400).json({ message: "currentStep is required" });
      }
      if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.saveOnboardingProgressData(authenticatedUser.id, {
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

  app.get("/api/progress/:userId", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (rejectMismatchedUserId(req.params.userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const progress = await storage.getUserProgress(authenticatedUser.id);
      if (!progress) {
        return res.status(404).json({ message: "No progress found" });
      }
      return res.json(progress);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/progress", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      const { userId, quizCompleted, reportUnlocked, pathType, onboardingCompleted } = req.body as {
        userId?: string;
        quizCompleted?: boolean;
        reportUnlocked?: boolean;
        pathType?: string;
        onboardingCompleted?: boolean;
      };
      if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.saveUserProgress(authenticatedUser.id, { quizCompleted, reportUnlocked, pathType, onboardingCompleted });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/progress/create", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      const { userId } = req.body as { userId?: string };
      if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.createUserProgress(authenticatedUser.id);
      return res.status(201).json({ ok: true });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/mission/status/:userId", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      if (rejectMismatchedUserId(req.params.userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const status = await storage.getMissionStatus(authenticatedUser.id);
      return res.json(status);
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/mission/complete", requireSupabaseUser, async (req, res) => {
    try {
      const authenticatedUser = getAuthenticatedUser(req);
      const { userId, missionId } = req.body as { userId: string; missionId: string };
      if (!missionId) {
        return res.status(400).json({ message: "missionId is required" });
      }
      if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const result = await storage.completeMission(authenticatedUser.id, missionId);
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
  app.post("/api/auth/sync", requireSupabaseUser, async (req, res) => {
    const authenticatedUser = getAuthenticatedUser(req);
    const { userId, firstName, dnaType, answers } = req.body as {
      userId?:   string;
      firstName?: string;
      dnaType?:  string;
      answers?:  object;
    };

    console.log("[sync] sync started");
    console.log("[sync] auth user id:", authenticatedUser.id);

    if (userId && rejectMismatchedUserId(userId, authenticatedUser.id)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (!authenticatedUser.email) {
      return res.status(400).json({ ok: false, message: "Authenticated account email is required" });
    }

    // ── Step 1: ensure public.users row ──────────────────────────────────────
    try {
      await storage.ensureUserRow(authenticatedUser.id, authenticatedUser.email, firstName, dnaType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[sync] sync failed — table: users —", msg);
      return res.status(500).json({ ok: false, failedTable: "users", error: msg });
    }

    // ── Step 2: ensure quiz_results row ──────────────────────────────────────
    let hasQuizResult = false;
    try {
      if (dnaType) {
        await storage.ensureQuizResult(authenticatedUser.id, dnaType, answers);
        hasQuizResult = true;
      } else {
        const existing = await storage.getQuizResultByUserId(authenticatedUser.id);
        hasQuizResult = !!existing;
        if (hasQuizResult) {
          console.log("[sync] quiz_results exists for authenticated user");
        } else {
          console.log("[sync] no quiz_results found — dnaType not provided, skipping insert");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[sync] sync failed — table: quiz_results —", msg);
      return res.status(500).json({ ok: false, failedTable: "quiz_results", error: msg });
    }

    console.log("[sync] sync complete — userId:", authenticatedUser.id, "hasQuizResult:", hasQuizResult);
    return res.json({ ok: true, hasQuizResult });
  });

  app.post("/api/waitlist", (_req, res) => {
    return res.status(410).json({ message: WAITLIST_UNAVAILABLE_MESSAGE });
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
