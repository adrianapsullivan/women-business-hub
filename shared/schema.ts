import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  answers: jsonb("answers").notNull(),
  dnaType: text("dna_type").notNull(),
  businessScores: jsonb("business_scores").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).pick({
  userId: true,
  answers: true,
  dnaType: true,
  businessScores: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;

export interface FoundationProgressData {
  step: number;
  completed: boolean;
  committed: boolean;
  topBusiness: string;
  assets: {
    comesNaturally: string;
    helpedWith: string;
    overcome: string;
    energize: string;
  };
  transformation: {
    whoToHelp: string;
    specificResult: string;
    whyMatters: string;
    whyYou: string;
  };
}

export interface FoundationProgress {
  userId: string;
  data: FoundationProgressData;
  updatedAt: Date;
}

export interface OnboardingProgressData {
  currentStep: string;
  completedSteps: string[];
  dnaType: string;
  lastVisitedRoute: string;
  onboardingComplete: boolean;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  dnaType: string;
  createdAt: string;
}

export interface InsertWaitlistEntry {
  name: string;
  email: string;
  dnaType: string;
}
