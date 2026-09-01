import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CALIBRATION_TABLES,
  calculateCalibratedScore,
} from "./v2-calibration";
import {
  CANONICAL_DNA_IDENTITIES,
  CLASSIFICATION_THRESHOLDS,
  type CanonicalDnaIdentity,
  type DnaAnswerValue,
} from "./types";
import {
  calculatePrimaryStability,
  calculateRawScores,
  classifyRankedProfile,
  enumerateSingleAnswerNeighbors,
  rankAnswerProfile,
  rankIdentityScores,
  scoreEntrepreneurDnaV2,
  type EntrepreneurDnaResponse,
  type IdentityScoreRecord,
} from "./v2-scoring";

function uniformAnswers(value: DnaAnswerValue): readonly EntrepreneurDnaResponse[] {
  return Array.from({ length: 25 }, (_unused, index) => ({
    questionId: index + 1,
    value,
  }));
}

function answersFromPattern(
  pattern: readonly DnaAnswerValue[],
): readonly EntrepreneurDnaResponse[] {
  assert.equal(pattern.length, 25);
  return pattern.map((value, index) => ({
    questionId: index + 1,
    value,
  }));
}

function identityScores(
  overrides: Partial<Record<CanonicalDnaIdentity, number>> = {},
): IdentityScoreRecord {
  return {
    strategic_builder: overrides.strategic_builder ?? 0,
    visionary_leader: overrides.visionary_leader ?? 0,
    influence_creator: overrides.influence_creator ?? 0,
    community_builder: overrides.community_builder ?? 0,
    knowledge_authority: overrides.knowledge_authority ?? 0,
    action_taker: overrides.action_taker ?? 0,
    freedom_strategist: overrides.freedom_strategist ?? 0,
    legacy_builder: overrides.legacy_builder ?? 0,
  };
}

function countAnswerDifferences(
  left: readonly EntrepreneurDnaResponse[],
  right: readonly EntrepreneurDnaResponse[],
): number {
  return left.reduce(
    (count, answer, index) => count + (answer.value === right[index].value ? 0 : 1),
    0,
  );
}

test("calculates all eight raw evidence totals for a controlled all-A fixture", () => {
  assert.deepEqual(calculateRawScores(uniformAnswers("A")), {
    strategic_builder: 4,
    visionary_leader: 34,
    influence_creator: 15,
    community_builder: 0,
    knowledge_authority: 7,
    action_taker: 26,
    freedom_strategist: 12,
    legacy_builder: 3,
  });
});

test("base ranking uses the exact calibrated scores from Slice 2", () => {
  const ranking = rankAnswerProfile(uniformAnswers("B"));

  for (const identity of CANONICAL_DNA_IDENTITIES) {
    assert.equal(
      ranking.calibratedScores[identity],
      calculateCalibratedScore(
        CALIBRATION_TABLES[identity],
        ranking.rawScores[identity],
      ),
    );
  }
  assert.equal(ranking.orderedIdentities.length, 8);
  assert.equal(ranking.primaryIdentity, ranking.orderedIdentities[0]);
  assert.equal(ranking.secondRankedIdentity, ranking.orderedIdentities[1]);
});

test("an exact calibrated tie is resolved by normalized raw score descending", () => {
  const ordered = rankIdentityScores(
    identityScores({ strategic_builder: 32, visionary_leader: 49 }),
    identityScores({ strategic_builder: 50, visionary_leader: 50 }),
  );

  assert.deepEqual(ordered.slice(0, 2), [
    "visionary_leader",
    "strategic_builder",
  ]);
});

test("a full calibrated and normalized tie is resolved by canonical order", () => {
  const ordered = rankIdentityScores(
    identityScores(),
    identityScores({
      strategic_builder: 50,
      visionary_leader: 50,
      influence_creator: 50,
      community_builder: 50,
      knowledge_authority: 50,
      action_taker: 50,
      freedom_strategist: 50,
      legacy_builder: 50,
    }),
  );

  assert.deepEqual(ordered, CANONICAL_DNA_IDENTITIES);
});

test("repeated base and complete scoring are deterministic", () => {
  const answers = uniformAnswers("C");

  assert.deepEqual(rankAnswerProfile(answers), rankAnswerProfile(answers));
  assert.deepEqual(scoreEntrepreneurDnaV2(answers), scoreEntrepreneurDnaV2(answers));
});

test("scores the controlled all-C fixture as Clear", () => {
  const result = scoreEntrepreneurDnaV2(uniformAnswers("C"));

  assert.equal(result.profileClassification, "clear");
  assert.equal(result.primaryIdentity, "community_builder");
  assert.equal(result.secondRankedIdentity, "influence_creator");
  assert.equal(result.primaryStabilityCount, 75);
  assert.equal(result.secondaryDna, null);
});

test("scores the controlled all-A fixture as a valid Dual result", () => {
  const result = scoreEntrepreneurDnaV2(uniformAnswers("A"));

  assert.equal(result.profileClassification, "dual");
  assert.equal(result.primaryIdentity, "visionary_leader");
  assert.equal(result.secondRankedIdentity, "action_taker");
  assert.equal(result.primaryStabilityCount, 73);
  assert.equal(result.secondaryDna, result.secondRankedIdentity);
});

test("scores the controlled repeating B-C-D-A fixture as Blended", () => {
  const result = scoreEntrepreneurDnaV2(
    answersFromPattern([
      "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D", "A", "B",
      "C", "D", "A", "B", "C", "D", "A", "B", "C", "D", "A", "B",
    ]),
  );

  assert.equal(result.profileClassification, "blended");
  assert.equal(result.primaryIdentity, "freedom_strategist");
  assert.equal(result.secondRankedIdentity, "strategic_builder");
  assert.equal(result.primaryStabilityCount, 40);
  assert.equal(result.secondaryDna, null);
});

test("enumerates exactly 75 neighboring profiles", () => {
  assert.equal(enumerateSingleAnswerNeighbors(uniformAnswers("A")).length, 75);
});

test("every neighboring profile differs by exactly one answer", () => {
  const answers = uniformAnswers("A");

  for (const neighbor of enumerateSingleAnswerNeighbors(answers)) {
    assert.equal(countAnswerDifferences(answers, neighbor), 1);
  }
});

test("every question contributes exactly three neighboring profiles", () => {
  const answers = uniformAnswers("A");
  const neighbors = enumerateSingleAnswerNeighbors(answers);

  for (let index = 0; index < answers.length; index += 1) {
    const changedAtQuestion = neighbors.filter(
      (neighbor) => neighbor[index].value !== answers[index].value,
    );
    assert.equal(changedAtQuestion.length, 3, `question ${index + 1}`);
  }
});

test("stability count is bounded and stability equals count divided by 75", () => {
  const answers = uniformAnswers("D");
  const primary = rankAnswerProfile(answers).primaryIdentity;
  const stability = calculatePrimaryStability(answers, primary);

  assert.ok(stability.primaryStabilityCount >= 0);
  assert.ok(stability.primaryStabilityCount <= 75);
  assert.equal(
    stability.primaryStability,
    stability.primaryStabilityCount / 75,
  );
});

test("base ranking does not calculate stability and stability is not recursive", () => {
  const ranking = rankAnswerProfile(uniformAnswers("A"));
  assert.ok(!("primaryStability" in ranking));

  const source = readFileSync(new URL("./v2-scoring.ts", import.meta.url), "utf8");
  const stabilitySection = source.slice(
    source.indexOf("export function calculatePrimaryStability"),
    source.indexOf("export function classifyRankedProfile"),
  );
  assert.equal(
    stabilitySection.match(/calculatePrimaryStability\s*\(/g)?.length,
    1,
  );
  assert.doesNotMatch(stabilitySection, /scoreEntrepreneurDnaV2\s*\(/);
});

const dualEligibleRanking = rankIdentityScores(
  identityScores(),
  identityScores({ strategic_builder: 86, visionary_leader: 82 }),
);
const dualEligibleBase = {
  rawScores: identityScores(),
  calibratedScores: identityScores({ strategic_builder: 86, visionary_leader: 82 }),
  orderedIdentities: dualEligibleRanking,
  primaryIdentity: dualEligibleRanking[0],
  secondRankedIdentity: dualEligibleRanking[1],
};

test("classifies a stable result outside dual thresholds as clear", () => {
  const ranking = {
    ...dualEligibleBase,
    calibratedScores: identityScores({ strategic_builder: 90, visionary_leader: 70 }),
  };
  const result = classifyRankedProfile(ranking, 0.9);

  assert.equal(result.profileClassification, "clear");
  assert.equal(result.secondaryDna, null);
});

test("classifies a stable qualifying result as dual", () => {
  const result = classifyRankedProfile(dualEligibleBase, 0.9);

  assert.equal(result.profileClassification, "dual");
  assert.equal(result.secondaryDna, dualEligibleBase.secondRankedIdentity);
});

test("classifies stability below the configured threshold as blended", () => {
  const result = classifyRankedProfile(
    dualEligibleBase,
    CLASSIFICATION_THRESHOLDS.primary_stability_threshold - 0.01,
  );

  assert.equal(result.profileClassification, "blended");
  assert.equal(result.secondaryDna, null);
});

test("high secondary evidence with a gap above the configured maximum is clear", () => {
  const calibratedScores = identityScores({
    strategic_builder: 95,
    visionary_leader: 80,
  });
  const orderedIdentities = rankIdentityScores(identityScores(), calibratedScores);
  const result = classifyRankedProfile(
    {
      rawScores: identityScores(),
      calibratedScores,
      orderedIdentities,
      primaryIdentity: orderedIdentities[0],
      secondRankedIdentity: orderedIdentities[1],
    },
    0.9,
  );

  assert.equal(result.profileClassification, "clear");
  assert.equal(result.secondaryDna, null);
});

test("a close gap with secondary evidence below the configured threshold is clear", () => {
  const calibratedScores = identityScores({
    strategic_builder: 79,
    visionary_leader: 75,
  });
  const orderedIdentities = rankIdentityScores(identityScores(), calibratedScores);
  const result = classifyRankedProfile(
    {
      rawScores: identityScores(),
      calibratedScores,
      orderedIdentities,
      primaryIdentity: orderedIdentities[0],
      secondRankedIdentity: orderedIdentities[1],
    },
    0.9,
  );

  assert.equal(result.profileClassification, "clear");
  assert.equal(result.secondaryDna, null);
});

test("blended classification takes priority over an otherwise dual-eligible result", () => {
  const result = classifyRankedProfile(
    dualEligibleBase,
    CLASSIFICATION_THRESHOLDS.primary_stability_threshold - 0.01,
  );

  assert.equal(result.profileClassification, "blended");
  assert.equal(result.secondaryDna, null);
});

test("clear and blended results never have secondary DNA", () => {
  assert.equal(
    classifyRankedProfile(
      {
        ...dualEligibleBase,
        calibratedScores: identityScores({ strategic_builder: 90, visionary_leader: 70 }),
      },
      0.9,
    ).secondaryDna,
    null,
  );
  assert.equal(
    classifyRankedProfile(dualEligibleBase, 0).secondaryDna,
    null,
  );
});

test("dual secondary DNA is exactly the second-ranked identity", () => {
  const result = classifyRankedProfile(dualEligibleBase, 1);

  assert.equal(result.profileClassification, "dual");
  assert.equal(result.secondaryDna, dualEligibleBase.secondRankedIdentity);
});

test("rejects incomplete, duplicate, unknown, and invalid answer sets", () => {
  assert.throws(() => calculateRawScores(uniformAnswers("A").slice(0, 24)), /25/);
  assert.throws(
    () =>
      calculateRawScores([
        ...uniformAnswers("A").slice(0, 24),
        { questionId: 1, value: "B" },
      ]),
    /duplicate|exactly once/i,
  );
  assert.throws(
    () =>
      calculateRawScores([
        ...uniformAnswers("A").slice(0, 24),
        { questionId: 26, value: "A" },
      ]),
    /unknown|1-25/i,
  );
  assert.throws(
    () =>
      calculateRawScores([
        ...uniformAnswers("A").slice(0, 24),
        { questionId: 25, value: "E" },
      ]),
    /A\/B\/C\/D/i,
  );
});

test("classification reads the versioned thresholds and scoring uses no randomness", () => {
  const source = readFileSync(new URL("./v2-scoring.ts", import.meta.url), "utf8");

  assert.match(source, /CLASSIFICATION_THRESHOLDS/);
  assert.doesNotMatch(source, /Math\s*\.\s*random/);
  assert.doesNotMatch(source, /randomBytes|randomFill|randomInt|randomUUID/);
  assert.doesNotMatch(source, /from\s+["'](?:node:)?crypto["']/);
});
