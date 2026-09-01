import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_VERSION,
  CALIBRATION_VERSION,
  CANONICAL_DNA_IDENTITIES,
  CLASSIFICATION_THRESHOLDS_BY_SCORING_VERSION,
  DNA_DISPLAY_NAMES,
  SCORING_VERSION,
  type CanonicalDnaIdentity,
} from "./types";
import {
  ENTREPRENEUR_DNA_V2_QUESTIONS,
  THEORETICAL_MAXIMA,
} from "./v2-matrix";

const EXPECTED_IDENTITIES = [
  "strategic_builder",
  "visionary_leader",
  "influence_creator",
  "community_builder",
  "knowledge_authority",
  "action_taker",
  "freedom_strategist",
  "legacy_builder",
] as const;

const EXPECTED_DISPLAY_NAMES = {
  strategic_builder: "Strategic Builder",
  visionary_leader: "Visionary Leader",
  influence_creator: "Influence Creator",
  community_builder: "Community Builder",
  knowledge_authority: "Knowledge Authority",
  action_taker: "Action Taker",
  freedom_strategist: "Freedom Strategist",
  legacy_builder: "Legacy Builder",
} as const;

const EXPECTED_MAXIMA: Record<CanonicalDnaIdentity, number> = {
  strategic_builder: 64,
  visionary_leader: 49,
  influence_creator: 33,
  community_builder: 65,
  knowledge_authority: 48,
  action_taker: 38,
  freedom_strategist: 22,
  legacy_builder: 20,
};

test("declares the approved version identifiers and versioned Beta thresholds", () => {
  assert.equal(ASSESSMENT_VERSION, "2.0-beta");
  assert.equal(SCORING_VERSION, "2.0-beta");
  assert.equal(CALIBRATION_VERSION, "2.0-beta-null-uniform");
  assert.deepEqual(
    CLASSIFICATION_THRESHOLDS_BY_SCORING_VERSION[SCORING_VERSION],
    {
      primary_stability_threshold: 0.7,
      secondary_evidence_threshold: 80,
      secondary_max_gap: 8,
    },
  );
});

test("declares exactly the eight canonical identities in deterministic tie order", () => {
  assert.deepEqual(CANONICAL_DNA_IDENTITIES, EXPECTED_IDENTITIES);
  assert.deepEqual(DNA_DISPLAY_NAMES, EXPECTED_DISPLAY_NAMES);
});

test("contains exactly 25 sequential questions with four A-D answers", () => {
  assert.equal(ENTREPRENEUR_DNA_V2_QUESTIONS.length, 25);

  ENTREPRENEUR_DNA_V2_QUESTIONS.forEach((question, index) => {
    assert.equal(question.id, index + 1);
    assert.ok(question.category.trim().length > 0);
    assert.ok(question.question.trim().length > 0);
    assert.equal(question.options.length, 4);
    assert.deepEqual(
      question.options.map((option) => option.value),
      ["A", "B", "C", "D"],
    );

    for (const option of question.options) {
      assert.ok(option.label.trim().length > 0);
    }
  });
});

test("uses only canonical identity IDs and non-negative integer evidence weights from 1 to 3", () => {
  const canonical = new Set<string>(CANONICAL_DNA_IDENTITIES);

  for (const question of ENTREPRENEUR_DNA_V2_QUESTIONS) {
    for (const option of question.options) {
      for (const [identity, weight] of Object.entries(option.weights)) {
        assert.ok(canonical.has(identity), `Unknown identity ${identity} in Q${question.id}${option.value}`);
        assert.ok(Number.isInteger(weight), `Non-integer weight in Q${question.id}${option.value}`);
        assert.ok(weight >= 1 && weight <= 3, `Out-of-range weight in Q${question.id}${option.value}`);
      }
    }
  }
});

test("marks only Q15 as potentially redundant with Q13", () => {
  const flagged = ENTREPRENEUR_DNA_V2_QUESTIONS
    .filter((question) => question.beta_analysis?.possible_redundancy_with_q13)
    .map((question) => question.id);

  assert.deepEqual(flagged, [15]);
});

test("independently derives the approved theoretical maxima from the matrix", () => {
  const derived = Object.fromEntries(
    CANONICAL_DNA_IDENTITIES.map((identity) => {
      const maximum = ENTREPRENEUR_DNA_V2_QUESTIONS.reduce((total, question) => {
        const bestForQuestion = Math.max(
          ...question.options.map((option) => option.weights[identity] ?? 0),
        );
        return total + bestForQuestion;
      }, 0);
      return [identity, maximum];
    }),
  ) as Record<CanonicalDnaIdentity, number>;

  assert.deepEqual(derived, EXPECTED_MAXIMA);
  assert.deepEqual(THEORETICAL_MAXIMA, EXPECTED_MAXIMA);
});
