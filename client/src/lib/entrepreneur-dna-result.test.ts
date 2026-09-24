import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CALIBRATION_VERSION,
  CANONICAL_DNA_IDENTITIES,
  SCORING_VERSION,
  ASSESSMENT_VERSION,
  type CanonicalDnaIdentity,
} from "../../../shared/entrepreneur-dna/types";
import {
  isEntrepreneurDnaV2ClientResult,
  isLegacyEntrepreneurDnaResult,
  readClientEntrepreneurDnaResult,
  toClientDnaDisplayResult,
  type EntrepreneurDnaV2ClientResult,
  type IdentityScoreRecord,
  type LegacyEntrepreneurDnaResult,
} from "./entrepreneur-dna-result";

function identityScores(
  overrides: Partial<Record<CanonicalDnaIdentity, number>> = {},
): IdentityScoreRecord {
  return {
    strategic_builder: overrides.strategic_builder ?? 1,
    visionary_leader: overrides.visionary_leader ?? 2,
    influence_creator: overrides.influence_creator ?? 3,
    community_builder: overrides.community_builder ?? 4,
    knowledge_authority: overrides.knowledge_authority ?? 5,
    action_taker: overrides.action_taker ?? 6,
    freedom_strategist: overrides.freedom_strategist ?? 7,
    legacy_builder: overrides.legacy_builder ?? 8,
  };
}

function validV2Result(
  classification: "clear" | "dual" | "blended" = "clear",
): EntrepreneurDnaV2ClientResult {
  return {
    answers: Array.from({ length: 25 }, (_unused, index) => ({
      questionId: index + 1,
      value: (["A", "B", "C", "D"] as const)[index % 4],
    })),
    raw_scores: identityScores(),
    calibrated_scores: identityScores({
      strategic_builder: 91,
      visionary_leader: 85,
      influence_creator: 73,
      community_builder: 62,
      knowledge_authority: 51,
      action_taker: 40,
      freedom_strategist: 29,
      legacy_builder: 18,
    }),
    primary_dna: "strategic_builder",
    secondary_dna: classification === "dual" ? "visionary_leader" : null,
    profile_classification: classification,
    primary_stability: 0.8,
    primary_stability_count: 60,
    assessment_version: ASSESSMENT_VERSION,
    scoring_version: SCORING_VERSION,
    calibration_version: CALIBRATION_VERSION,
  };
}

const legacyResult: LegacyEntrepreneurDnaResult = {
  dnaType: "Strategic Builder",
  secondaryDnaType: "Visionary Leader",
  businessScores: {
    affiliate: 72,
    digital: 88,
    personalBrand: 65,
    knowledge: 70,
    community: 55,
  },
};

test("legacy V1 results remain readable without acquiring V2 fields", () => {
  assert.equal(isLegacyEntrepreneurDnaResult(legacyResult), true);
  assert.equal(readClientEntrepreneurDnaResult(legacyResult), legacyResult);
  assert.equal("assessment_version" in legacyResult, false);
});

test("a complete V2 client result can be represented and passes its guard", () => {
  const result = validV2Result("dual");

  assert.equal(isEntrepreneurDnaV2ClientResult(result), true);
  assert.equal(readClientEntrepreneurDnaResult(result), result);
});

test("Clear and Blended V2 results support null secondary DNA", () => {
  for (const classification of ["clear", "blended"] as const) {
    const result = validV2Result(classification);
    assert.equal(result.secondary_dna, null);
    assert.equal(isEntrepreneurDnaV2ClientResult(result), true);
  }
});

test("Dual V2 results require and support a valid secondary DNA", () => {
  const valid = validV2Result("dual");
  assert.equal(valid.secondary_dna, "visionary_leader");
  assert.equal(isEntrepreneurDnaV2ClientResult(valid), true);

  assert.equal(
    isEntrepreneurDnaV2ClientResult({ ...valid, secondary_dna: null }),
    false,
  );
  assert.equal(
    isEntrepreneurDnaV2ClientResult({ ...valid, secondary_dna: "unknown" }),
    false,
  );
});

test("all eight raw and calibrated scores are preserved", () => {
  const result = validV2Result();
  const parsed = readClientEntrepreneurDnaResult(result);

  assert.ok(parsed && isEntrepreneurDnaV2ClientResult(parsed));
  assert.deepEqual(Object.keys(parsed.raw_scores), CANONICAL_DNA_IDENTITIES);
  assert.deepEqual(
    Object.keys(parsed.calibrated_scores),
    CANONICAL_DNA_IDENTITIES,
  );
  assert.deepEqual(parsed.raw_scores, result.raw_scores);
  assert.deepEqual(parsed.calibrated_scores, result.calibrated_scores);
});

test("assessment, scoring, and calibration versions are preserved", () => {
  const result = validV2Result();

  assert.equal(result.assessment_version, "1.0-beta");
  assert.equal(result.scoring_version, "1.0-beta");
  assert.equal(result.calibration_version, "1.0-beta-null-uniform");
});

test("legacy V1 data cannot accidentally pass the V2 guard", () => {
  assert.equal(isEntrepreneurDnaV2ClientResult(legacyResult), false);
});

test("malformed V2 data cannot pass the V2 guard", () => {
  const valid = validV2Result();
  const { legacy_builder: _removed, ...incompleteRawScores } = valid.raw_scores;

  assert.equal(
    isEntrepreneurDnaV2ClientResult({
      ...valid,
      raw_scores: incompleteRawScores,
    }),
    false,
  );
  assert.equal(
    isEntrepreneurDnaV2ClientResult({
      ...valid,
      assessment_version: "different",
    }),
    false,
  );
  assert.equal(
    isEntrepreneurDnaV2ClientResult({
      ...valid,
      answers: valid.answers.slice(0, 24),
    }),
    false,
  );
});

test("valid V2 data passes the V2 guard", () => {
  assert.equal(isEntrepreneurDnaV2ClientResult(validV2Result()), true);
});

test("the display adapter maps canonical V2 IDs explicitly and preserves V1", () => {
  assert.deepEqual(toClientDnaDisplayResult(validV2Result("dual")), {
    resultVersion: "1.0-beta",
    primaryDnaType: "Strategic Builder",
    secondaryDnaType: "Visionary Leader",
    profileClassification: "dual",
  });
  assert.deepEqual(toClientDnaDisplayResult(legacyResult), {
    resultVersion: "legacy",
    primaryDnaType: "Strategic Builder",
    secondaryDnaType: "Visionary Leader",
  });
});

test("adapters do not mutate legacy V1 data", () => {
  const before = JSON.stringify(legacyResult);

  readClientEntrepreneurDnaResult(legacyResult);
  toClientDnaDisplayResult(legacyResult);

  assert.equal(JSON.stringify(legacyResult), before);
});

test("the compatibility layer introduces no randomness", () => {
  const source = readFileSync(
    new URL("./entrepreneur-dna-result.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /Math\s*\.\s*random/);
  assert.doesNotMatch(source, /randomBytes|randomFill|randomInt|randomUUID/);
  assert.doesNotMatch(source, /from\s+["'](?:node:)?crypto["']/);
});
