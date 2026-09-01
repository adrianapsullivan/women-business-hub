import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CALIBRATION_VERSION,
  CANONICAL_DNA_IDENTITIES,
  SCORING_VERSION,
  type EntrepreneurDnaQuestion,
} from "./types";
import { ENTREPRENEUR_DNA_V2_QUESTIONS } from "./v2-matrix";
import {
  CALIBRATION_TABLES,
  TOTAL_OUTCOME_COUNT,
  calculateCalibratedScore,
  generateExactCalibrationTables,
} from "./v2-calibration";

const EXPECTED_TOTAL_OUTCOME_COUNT = 4n ** 25n;

test("generates exact deterministic distributions for all eight canonical identities", () => {
  assert.deepEqual(Object.keys(CALIBRATION_TABLES), CANONICAL_DNA_IDENTITIES);

  for (const identity of CANONICAL_DNA_IDENTITIES) {
    const distribution = CALIBRATION_TABLES[identity];
    assert.equal(distribution.identity, identity);
    assert.equal(distribution.scoringVersion, SCORING_VERSION);
    assert.equal(distribution.calibrationVersion, CALIBRATION_VERSION);
    assert.ok(distribution.counts.length > 0);
  }
});

test("each exact distribution contains non-negative integer counts totaling 4^25", () => {
  assert.equal(TOTAL_OUTCOME_COUNT, EXPECTED_TOTAL_OUTCOME_COUNT);

  for (const identity of CANONICAL_DNA_IDENTITIES) {
    const distribution = CALIBRATION_TABLES[identity];
    const total = distribution.counts.reduce((sum, count) => sum + count, 0n);

    assert.equal(total, EXPECTED_TOTAL_OUTCOME_COUNT, identity);
    assert.equal(distribution.totalOutcomeCount, EXPECTED_TOTAL_OUTCOME_COUNT);
    for (const count of distribution.counts) {
      assert.ok(count >= 0n, `${identity} contains a negative count`);
    }
  }
});

test("converted probability mass is non-negative and sums approximately to one", () => {
  for (const identity of CANONICAL_DNA_IDENTITIES) {
    const distribution = CALIBRATION_TABLES[identity];
    const probabilities = distribution.counts.map(
      (count) => Number(count) / Number(distribution.totalOutcomeCount),
    );
    const totalProbability = probabilities.reduce(
      (sum, probability) => sum + probability,
      0,
    );

    assert.ok(
      probabilities.every((probability) => probability >= 0),
      `${identity} contains negative probability mass`,
    );
    assert.ok(
      Math.abs(totalProbability - 1) < 1e-12,
      `${identity} probability mass was ${totalProbability}`,
    );
  }
});

test("calibrated scores remain between zero and 100 for every supported raw score", () => {
  for (const identity of CANONICAL_DNA_IDENTITIES) {
    const distribution = CALIBRATION_TABLES[identity];

    distribution.counts.forEach((_count, rawScore) => {
      const calibratedScore = calculateCalibratedScore(distribution, rawScore);
      assert.ok(calibratedScore >= 0, `${identity} score ${rawScore} was below zero`);
      assert.ok(calibratedScore <= 100, `${identity} score ${rawScore} exceeded 100`);
    });
  }
});

test("calibrated scores are monotonic with raw score for every identity", () => {
  for (const identity of CANONICAL_DNA_IDENTITIES) {
    const distribution = CALIBRATION_TABLES[identity];
    let previous = -Infinity;

    distribution.counts.forEach((_count, rawScore) => {
      const calibratedScore = calculateCalibratedScore(distribution, rawScore);
      assert.ok(
        calibratedScore >= previous,
        `${identity} decreased at raw score ${rawScore}`,
      );
      previous = calibratedScore;
    });
  }
});

test("uses the approved mid-percentile treatment for tied probability mass", () => {
  const distribution = {
    identity: "strategic_builder" as const,
    scoringVersion: SCORING_VERSION,
    calibrationVersion: CALIBRATION_VERSION,
    matrixFingerprint: "test-fixture",
    counts: [1n, 2n, 1n],
    totalOutcomeCount: 4n,
  };

  assert.equal(calculateCalibratedScore(distribution, 0), 12.5);
  assert.equal(calculateCalibratedScore(distribution, 1), 50);
  assert.equal(calculateCalibratedScore(distribution, 2), 87.5);
});

test("the same matrix and versions always generate identical distributions", () => {
  const first = generateExactCalibrationTables();
  const second = generateExactCalibrationTables();

  assert.deepEqual(first, second);
  assert.deepEqual(first, CALIBRATION_TABLES);
});

test("calibration fails clearly when matrix or version integrity does not match", () => {
  const mismatchedMatrix: readonly EntrepreneurDnaQuestion[] =
    ENTREPRENEUR_DNA_V2_QUESTIONS.map((question, index) =>
      index === 0
        ? { ...question, question: `${question.question} changed` }
        : question,
    );

  assert.throws(
    () => generateExactCalibrationTables({ questions: mismatchedMatrix }),
    /matrix integrity/i,
  );
  assert.throws(
    () => generateExactCalibrationTables({ scoringVersion: "different" }),
    /scoring version/i,
  );
  assert.throws(
    () => generateExactCalibrationTables({ calibrationVersion: "different" }),
    /calibration version/i,
  );
});

test("the calibration engine imports and uses no randomness", () => {
  const source = readFileSync(new URL("./v2-calibration.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /Math\s*\.\s*random/);
  assert.doesNotMatch(source, /randomBytes|randomFill|randomInt|randomUUID/);
  assert.doesNotMatch(source, /from\s+["'](?:node:)?crypto["']/);
});
