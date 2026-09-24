import assert from "node:assert/strict";
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
  type IdentityScoreRecord,
  type RankedAnswerProfile,
} from "./v2-scoring";
import { ENTREPRENEUR_DNA_V2_QUESTIONS } from "./v2-matrix";

const lockedAnswers = [
  "B", "C", "C", "A", "A", "A", "B", "C", "B", "B", "C", "D", "B",
  "C", "B", "B", "B", "C", "D", "C", "A", "A", "C", "C", "C",
] as const;
function answers(values: readonly DnaAnswerValue[]) {
  return values.map((value, index) => ({ questionId: index + 1, value }));
}
const fixture = answers(lockedAnswers);
const uniform = (value: DnaAnswerValue) => answers(Array<DnaAnswerValue>(25).fill(value));

function scores(overrides: Partial<IdentityScoreRecord> = {}): IdentityScoreRecord {
  return Object.fromEntries(CANONICAL_DNA_IDENTITIES.map((id) => [id, overrides[id] ?? 0])) as unknown as IdentityScoreRecord;
}
function evidence(overrides: Partial<Record<CanonicalDnaIdentity, boolean>> = {}) {
  return Object.fromEntries(CANONICAL_DNA_IDENTITIES.map((id) => [id, overrides[id] ?? false])) as Record<CanonicalDnaIdentity, boolean>;
}
function syntheticRanking(
  primary = "strategic_builder" as CanonicalDnaIdentity,
  second = "visionary_leader" as CanonicalDnaIdentity,
  topScore = 90,
  secondScore = 84,
): RankedAnswerProfile {
  const calibratedScores = scores({ [primary]: topScore, [second]: secondScore });
  return {
    rawScores: scores(),
    calibratedScores,
    evidenceBreadth: scores({ [primary]: 3, [second]: 3 }),
    directEvidenceBreadth: scores({ [primary]: 3, [second]: 3 }),
    constructEvidence: evidence({ [primary]: true, [second]: true }),
    orderedIdentities: rankIdentityScores(scores(), calibratedScores),
    primaryIdentity: primary,
    secondRankedIdentity: second,
  };
}
const stability = (primaryCount: number, pairCount: number) => ({
  primaryStabilityCount: primaryCount,
  primaryStability: primaryCount / 75,
  dualPairStabilityCount: pairCount,
  neighborCount: 75,
});

test("frozen blind fixture produces exactly the specified raw identity totals", () => {
  assert.deepEqual(calculateRawScores(fixture), {
    strategic_builder: 9,
    visionary_leader: 6,
    influence_creator: 9,
    community_builder: 36,
    knowledge_authority: 3,
    action_taker: 3,
    freedom_strategist: 3,
    legacy_builder: 6,
  });
});

test("identity-specific calibration equals the exact null distribution and is deterministic", () => {
  const first = rankAnswerProfile(fixture);
  assert.deepEqual(first, rankAnswerProfile(fixture));
  for (const id of CANONICAL_DNA_IDENTITIES) {
    assert.equal(first.calibratedScores[id], calculateCalibratedScore(CALIBRATION_TABLES[id], first.rawScores[id]));
  }
  assert.deepEqual(scoreEntrepreneurDnaV2(fixture), scoreEntrepreneurDnaV2(fixture));
});

test("calibrated ties use normalized raw evidence, then canonical order", () => {
  const ordered = rankIdentityScores(scores({ strategic_builder: 30, visionary_leader: 54 }), scores({ strategic_builder: 50, visionary_leader: 50 }));
  assert.deepEqual(ordered.slice(0, 2), ["visionary_leader", "strategic_builder"]);
  assert.deepEqual(rankIdentityScores(scores(), scores()), CANONICAL_DNA_IDENTITIES);
});

test("75 unique single-answer neighbors fully rescore every replacement", () => {
  const neighbors = enumerateSingleAnswerNeighbors(fixture);
  assert.equal(neighbors.length, 75);
  assert.equal(new Set(neighbors.map((neighbor) => JSON.stringify(neighbor))).size, 75);
  for (const neighbor of neighbors) {
    const differences = neighbor.filter((answer, i) => answer.value !== fixture[i].value);
    assert.equal(differences.length, 1);
    assert.ok(CANONICAL_DNA_IDENTITIES.includes(rankAnswerProfile(neighbor).primaryIdentity));
  }
  for (let i = 0; i < 25; i++) {
    assert.equal(neighbors.filter((neighbor) => neighbor[i].value !== fixture[i].value).length, 3);
  }
});

test("pair stability counts either ordering of the same two identities", () => {
  const ranking = rankAnswerProfile(fixture);
  const neighbors = enumerateSingleAnswerNeighbors(fixture);
  const expected = neighbors.filter((neighbor) => {
    const topTwo = rankAnswerProfile(neighbor).orderedIdentities.slice(0, 2);
    return topTwo.includes(ranking.primaryIdentity) && topTwo.includes(ranking.secondRankedIdentity);
  }).length;
  const result = calculatePrimaryStability(fixture, ranking.primaryIdentity, ranking.secondRankedIdentity);
  assert.equal(result.dualPairStabilityCount, expected);
  assert.equal(result.neighborCount, 75);
  assert.equal(result.primaryStability, result.primaryStabilityCount / 75);
  assert.equal(
    calculatePrimaryStability(fixture, ranking.secondRankedIdentity, ranking.primaryIdentity).dualPairStabilityCount,
    expected,
  );
});

test("Dual is evaluated before Clear and needs a stable pair, breadth and both safeguards", () => {
  const ranking = syntheticRanking();
  assert.deepEqual(classifyRankedProfile(ranking, stability(0, 53)), {
    profileClassification: "dual", secondaryDna: "visionary_leader",
  });
  assert.equal(classifyRankedProfile(ranking, stability(75, 52)).profileClassification, "blended");
  assert.equal(classifyRankedProfile({ ...ranking, directEvidenceBreadth: scores({ strategic_builder: 2, visionary_leader: 3 }) }, stability(75, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile({ ...ranking, directEvidenceBreadth: scores({ strategic_builder: 3, visionary_leader: 2 }) }, stability(75, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile({ ...ranking, constructEvidence: evidence({ strategic_builder: true }) }, stability(75, 75)).profileClassification, "blended");
});

test("Clear requires score at least 80, gap greater than 8, 53 stable neighbors and three direct facets", () => {
  const ranking = syntheticRanking("strategic_builder", "visionary_leader", 90, 70);
  assert.equal(classifyRankedProfile(ranking, stability(53, 0)).profileClassification, "clear");
  assert.equal(classifyRankedProfile(ranking, stability(52, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile({ ...ranking, directEvidenceBreadth: scores({ strategic_builder: 2 }) }, stability(75, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile({ ...ranking, constructEvidence: evidence() }, stability(75, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile(syntheticRanking("strategic_builder", "visionary_leader", 79, 60), stability(75, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile(syntheticRanking("strategic_builder", "visionary_leader", 90, 82), stability(75, 0)).profileClassification, "blended");
});

test("three distinct +2/+3 facets satisfy classification breadth", () => {
  const profile = uniform("A");
  profile[14] = { questionId: 15, value: "D" };
  profile[17] = { questionId: 18, value: "C" };
  profile[18] = { questionId: 19, value: "D" };
  const observed = rankAnswerProfile(profile);
  assert.equal(observed.directEvidenceBreadth.legacy_builder, 3);
  assert.equal(observed.constructEvidence.legacy_builder, true);

  const eligible = {
    ...syntheticRanking("legacy_builder", "visionary_leader", 90, 70),
    evidenceBreadth: observed.evidenceBreadth,
    directEvidenceBreadth: observed.directEvidenceBreadth,
    constructEvidence: observed.constructEvidence,
  };
  assert.equal(classifyRankedProfile(eligible, stability(53, 0)).profileClassification, "clear");
});

test("a +1 cross-identity point cannot supply a missing third direct facet for Clear or Dual", () => {
  const profile = uniform("A");
  profile[14] = { questionId: 15, value: "D" }; // Legacy +3, reward/long-term
  profile[17] = { questionId: 18, value: "C" }; // Legacy +3, long-term
  profile[21] = { questionId: 22, value: "D" }; // Legacy +1, problem-solving
  const observed = rankAnswerProfile(profile);
  assert.equal(observed.rawScores.legacy_builder, 7);
  assert.equal(observed.evidenceBreadth.legacy_builder, 3);
  assert.equal(observed.directEvidenceBreadth.legacy_builder, 2);
  assert.equal(observed.constructEvidence.legacy_builder, true);

  const clearCandidate = {
    ...syntheticRanking("legacy_builder", "visionary_leader", 90, 70),
    evidenceBreadth: observed.evidenceBreadth,
    directEvidenceBreadth: observed.directEvidenceBreadth,
    constructEvidence: observed.constructEvidence,
  };
  assert.equal(classifyRankedProfile(clearCandidate, stability(75, 75)).profileClassification, "blended");

  const dualCandidate = {
    ...syntheticRanking("legacy_builder", "visionary_leader"),
    evidenceBreadth: scores({ legacy_builder: observed.evidenceBreadth.legacy_builder, visionary_leader: 3 }),
    directEvidenceBreadth: scores({ legacy_builder: observed.directEvidenceBreadth.legacy_builder, visionary_leader: 3 }),
    constructEvidence: evidence({ legacy_builder: true, visionary_leader: true }),
  };
  assert.equal(classifyRankedProfile(dualCandidate, stability(75, 75)).profileClassification, "blended");
  assert.equal(classifyRankedProfile({
    ...dualCandidate,
    directEvidenceBreadth: scores({ legacy_builder: 3, visionary_leader: 2 }),
  }, stability(75, 75)).profileClassification, "blended");
});

test("repeated evidence in one facet does not create artificial breadth", () => {
  const profile = answers(Array<DnaAnswerValue>(25).fill("A"));
  const ranked = rankAnswerProfile(profile);
  for (const identity of CANONICAL_DNA_IDENTITIES) {
    const scoringQuestions = ENTREPRENEUR_DNA_V2_QUESTIONS.filter((q) => q.options[0].weights[identity]);
    assert.equal(ranked.evidenceBreadth[identity], new Set(scoringQuestions.map((q) => q.category)).size);
    assert.equal(ranked.directEvidenceBreadth[identity], new Set(scoringQuestions.filter((q) => (q.options[0].weights[identity] ?? 0) >= 2).map((q) => q.category)).size);
  }
  assert.ok(ENTREPRENEUR_DNA_V2_QUESTIONS.filter((q) => q.options[0].weights.strategic_builder).length > ranked.evidenceBreadth.strategic_builder);
  assert.equal(CLASSIFICATION_THRESHOLDS.minimum_breadth, 3);
});

test("construct safeguards require specific selected evidence, not incidental points", () => {
  const allB = rankAnswerProfile(uniform("B"));
  // Q5C and Q22D can give Legacy incidental +1 without stewardship/tradeoff.
  const incidental = answers(Array<DnaAnswerValue>(25).fill("B"));
  incidental[4] = { questionId: 5, value: "C" };
  incidental[21] = { questionId: 22, value: "D" };
  const ranked = rankAnswerProfile(incidental);
  assert.ok(ranked.rawScores.legacy_builder > allB.rawScores.legacy_builder);
  assert.equal(ranked.constructEvidence.legacy_builder, false);
  incidental[14] = { questionId: 15, value: "D" };
  assert.equal(rankAnswerProfile(incidental).constructEvidence.legacy_builder, true);
  incidental[14] = { questionId: 15, value: "B" };
  incidental[24] = { questionId: 25, value: "D" };
  assert.equal(rankAnswerProfile(incidental).constructEvidence.legacy_builder, true);

  const freedom = answers(Array<DnaAnswerValue>(25).fill("B"));
  freedom[4] = { questionId: 5, value: "A" };
  freedom[8] = { questionId: 9, value: "D" };
  assert.equal(rankAnswerProfile(freedom).constructEvidence.freedom_strategist, false);
  freedom[12] = { questionId: 13, value: "A" };
  assert.equal(rankAnswerProfile(freedom).constructEvidence.freedom_strategist, true);
});

test("rejects incomplete, duplicate and unknown answers", () => {
  assert.throws(() => calculateRawScores(fixture.slice(0, 24)), /25/);
  assert.throws(() => calculateRawScores([...fixture.slice(0, 24), { questionId: 1, value: "A" }]), /duplicate/);
  assert.throws(() => calculateRawScores([...fixture.slice(0, 24), { questionId: 26, value: "A" }]), /Unknown/);
});