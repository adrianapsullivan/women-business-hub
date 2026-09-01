import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isEntrepreneurDnaV2ClientResult } from "./entrepreneur-dna-result";
import {
  ACTIVE_ENTREPRENEUR_DNA_V2_QUESTIONS,
  V2_RESULT_STORAGE_KEY,
  createEntrepreneurDnaV2Result,
  getPostReportRoute,
  getSafeDnaRoute,
  isLegacyBusinessPathAllowed,
  readActiveClientDnaResult,
} from "./entrepreneur-dna-v2-activation";
import { ENTREPRENEUR_DNA_V2_QUESTIONS } from "../../../shared/entrepreneur-dna/v2-matrix";
import { scoreEntrepreneurDnaV2 } from "../../../shared/entrepreneur-dna/v2-scoring";
import type { DnaAnswerValue } from "../../../shared/entrepreneur-dna/types";

function answersFromPattern(pattern: string) {
  assert.equal(pattern.length, 25);
  return [...pattern].map((value, index) => ({
    questionId: index + 1,
    value: dnaAnswerValue(value),
  }));
}

function dnaAnswerValue(value: string): DnaAnswerValue {
  if (value === "A" || value === "B" || value === "C" || value === "D") {
    return value;
  }
  throw new Error(`Invalid fixture answer ${value}`);
}

function uniformAnswers(value: DnaAnswerValue) {
  return Array.from({ length: 25 }, (_unused, index) => ({
    questionId: index + 1,
    value,
  }));
}

const legacyResult = {
  dnaType: "Strategic Builder" as const,
  secondaryDnaType: "Visionary Leader" as const,
  businessScores: {
    affiliate: 72,
    digital: 88,
    personalBrand: 65,
    knowledge: 70,
    community: 55,
  },
};

test("activates exactly the approved 25-question V2 matrix", () => {
  assert.equal(ACTIVE_ENTREPRENEUR_DNA_V2_QUESTIONS, ENTREPRENEUR_DNA_V2_QUESTIONS);
  assert.equal(ACTIVE_ENTREPRENEUR_DNA_V2_QUESTIONS.length, 25);
});

test("V2 completion uses the approved scoring engine as its authority", () => {
  const answers = uniformAnswers("A");
  const scoring = scoreEntrepreneurDnaV2(answers);
  const result = createEntrepreneurDnaV2Result(answers);

  assert.deepEqual(result.raw_scores, scoring.rawScores);
  assert.deepEqual(result.calibrated_scores, scoring.calibratedScores);
  assert.equal(result.primary_dna, scoring.primaryIdentity);
  assert.equal(result.secondary_dna, scoring.secondaryDna);
  assert.equal(result.profile_classification, scoring.profileClassification);
  assert.equal(result.primary_stability, scoring.primaryStability);
  assert.equal(result.primary_stability_count, scoring.primaryStabilityCount);
});

test("generated V2 result passes the Slice 4 guard and preserves all eight scores", () => {
  const result = createEntrepreneurDnaV2Result(uniformAnswers("C"));

  assert.equal(isEntrepreneurDnaV2ClientResult(result), true);
  assert.equal(Object.keys(result.raw_scores).length, 8);
  assert.equal(Object.keys(result.calibrated_scores).length, 8);
});

test("generated V2 result preserves exact versions", () => {
  const result = createEntrepreneurDnaV2Result(uniformAnswers("C"));

  assert.equal(result.assessment_version, "2.0-beta");
  assert.equal(result.scoring_version, "2.0-beta");
  assert.equal(result.calibration_version, "2.0-beta-null-uniform");
});

test("Clear, Dual, and Blended preserve their approved secondary semantics", () => {
  const clear = createEntrepreneurDnaV2Result(uniformAnswers("C"));
  const dual = createEntrepreneurDnaV2Result(uniformAnswers("A"));
  const blended = createEntrepreneurDnaV2Result(
    answersFromPattern("BCDABCDABCDABCDABCDABCDAB"),
  );

  assert.equal(clear.profile_classification, "clear");
  assert.equal(clear.secondary_dna, null);
  assert.equal(dual.profile_classification, "dual");
  assert.equal(dual.secondary_dna, "action_taker");
  assert.equal(blended.profile_classification, "blended");
  assert.equal(blended.secondary_dna, null);
});

test("legacy V1 remains readable and is not migrated or mutated", () => {
  const before = JSON.stringify(legacyResult);
  const parsed = readActiveClientDnaResult(null, JSON.stringify(legacyResult));

  assert.deepEqual(parsed, legacyResult);
  assert.equal(JSON.stringify(legacyResult), before);
  assert.equal(isEntrepreneurDnaV2ClientResult(parsed), false);
});

test("a valid V2 result is stored separately and takes presentation priority", () => {
  const v2 = createEntrepreneurDnaV2Result(uniformAnswers("C"));
  const parsed = readActiveClientDnaResult(
    JSON.stringify(v2),
    JSON.stringify(legacyResult),
  );

  assert.equal(V2_RESULT_STORAGE_KEY, "wbe_entrepreneur_dna_v2_result");
  assert.deepEqual(parsed, v2);
  assert.deepEqual(legacyResult.businessScores, {
    affiliate: 72,
    digital: 88,
    personalBrand: 65,
    knowledge: 70,
    community: 55,
  });
});

test("V2 cannot enter V1-only compatibility or foundation paths", () => {
  const v2 = createEntrepreneurDnaV2Result(uniformAnswers("C"));

  assert.equal(isLegacyBusinessPathAllowed(v2), false);
  assert.equal(getSafeDnaRoute("/compatibility", v2), "/report");
  assert.equal(getSafeDnaRoute("/foundation", v2), "/report");
  assert.equal(getPostReportRoute(v2), "/dashboard");

  assert.equal(isLegacyBusinessPathAllowed(legacyResult), true);
  assert.equal(getSafeDnaRoute("/compatibility", legacyResult), "/compatibility");
  assert.equal(getPostReportRoute(legacyResult), "/compatibility");
});

test("V2 result manufactures no business scores, percentages, or top business", () => {
  const result = createEntrepreneurDnaV2Result(uniformAnswers("C"));

  assert.equal("businessScores" in result, false);
  assert.equal("compatibilityPercentages" in result, false);
  assert.equal("topBusiness" in result, false);
});

test("repeated answers generate deeply identical V2 results", () => {
  const answers = uniformAnswers("D");

  assert.deepEqual(
    createEntrepreneurDnaV2Result(answers),
    createEntrepreneurDnaV2Result(answers),
  );
});

test("the active quiz uses the V2 activation boundary and no legacy scorer or result shape", () => {
  const quizSource = readFileSync(
    new URL("../pages/quiz.tsx", import.meta.url),
    "utf8",
  );

  assert.match(quizSource, /ACTIVE_ENTREPRENEUR_DNA_V2_QUESTIONS/);
  assert.match(quizSource, /createEntrepreneurDnaV2Result/);
  assert.doesNotMatch(quizSource, /scoreQuiz/);
  assert.doesNotMatch(quizSource, /businessScores/);
  assert.doesNotMatch(quizSource, /\/api\/quiz\/submit/);
  assert.doesNotMatch(quizSource, /setItem\(["']wbe_result["']/);
});

test("report and V1-only business pages enforce the V2 route boundary", () => {
  const reportSource = readFileSync(
    new URL("../pages/report.tsx", import.meta.url),
    "utf8",
  );
  const compatibilitySource = readFileSync(
    new URL("../pages/compatibility.tsx", import.meta.url),
    "utf8",
  );
  const foundationSource = readFileSync(
    new URL("../pages/foundation.tsx", import.meta.url),
    "utf8",
  );

  assert.match(reportSource, /getPostReportRoute/);
  assert.match(compatibilitySource, /getSafeDnaRoute/);
  assert.match(foundationSource, /getSafeDnaRoute/);
});

test("the V2 activation boundary introduces no randomness", () => {
  const source = readFileSync(
    new URL("./entrepreneur-dna-v2-activation.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /Math\s*\.\s*random/);
  assert.doesNotMatch(source, /randomBytes|randomFill|randomInt|randomUUID/);
  assert.doesNotMatch(source, /from\s+["'](?:node:)?crypto["']/);
});
