import {
  CALIBRATION_TABLES,
  calculateCalibratedScore,
} from "./v2-calibration";
import { ENTREPRENEUR_DNA_V2_QUESTIONS, THEORETICAL_MAXIMA } from "./v2-matrix";
import {
  CANONICAL_DNA_IDENTITIES,
  CLASSIFICATION_THRESHOLDS,
  type CanonicalDnaIdentity,
  type DnaAnswerValue,
} from "./types";

const ANSWER_VALUES: readonly DnaAnswerValue[] = ["A", "B", "C", "D"];
const EXPECTED_ANSWER_COUNT = 25;
const EXPECTED_NEIGHBOR_COUNT = 75;

export interface EntrepreneurDnaResponse {
  readonly questionId: number;
  readonly value: DnaAnswerValue;
}

export type IdentityScoreRecord = Readonly<Record<CanonicalDnaIdentity, number>>;

export interface RankedAnswerProfile {
  readonly rawScores: IdentityScoreRecord;
  readonly calibratedScores: IdentityScoreRecord;
  readonly evidenceBreadth: IdentityScoreRecord;
  readonly directEvidenceBreadth: IdentityScoreRecord;
  readonly constructEvidence: Readonly<Record<CanonicalDnaIdentity, boolean>>;
  readonly orderedIdentities: readonly CanonicalDnaIdentity[];
  readonly primaryIdentity: CanonicalDnaIdentity;
  readonly secondRankedIdentity: CanonicalDnaIdentity;
}

export interface PrimaryStabilityResult {
  readonly primaryStabilityCount: number;
  readonly primaryStability: number;
  readonly dualPairStabilityCount: number;
  readonly neighborCount: number;
}

export type ProfileClassification = "clear" | "dual" | "blended";

export interface ClassificationResult {
  readonly profileClassification: ProfileClassification;
  readonly secondaryDna: CanonicalDnaIdentity | null;
}

export interface EntrepreneurDnaV2Score
  extends RankedAnswerProfile,
    PrimaryStabilityResult,
    ClassificationResult {}

// Each qualifying option supplies direct evidence of the named construct. Incidental
// cross-identity points (such as +1 Legacy for a systems answer) do not satisfy it.
// Freedom needs a meaningful autonomy tradeoff. Legacy needs stewardship
// or a long-term tradeoff, not incidental systems points.
const CONSTRUCT_OPTIONS: Readonly<Record<CanonicalDnaIdentity, readonly string[]>> = {
  strategic_builder: ["1A", "2A", "3B", "4C", "5C", "6D", "7C", "8C", "9B", "10A", "11B", "12D", "13D", "14A", "15C", "21B", "22D", "23B", "24B"],
  visionary_leader: ["1B", "2D", "3D", "4B", "5B", "6C", "7D", "8D", "11D", "12C", "13C", "18A", "19C", "20B", "21A", "23A", "24A", "25A"],
  influence_creator: ["2B", "14D", "15B", "16A", "17C", "19A", "20C", "22A"],
  community_builder: ["2C", "3C", "4D", "6A", "7B", "9C", "10D", "11C", "13B", "14C", "16B", "17B", "18B", "21C", "23C", "24C", "25C"],
  knowledge_authority: ["1D", "4A", "6B", "8B", "10C", "11A", "14B", "15A", "16C", "17A", "20D", "25B"],
  action_taker: ["1C", "3A", "7A", "10B", "12B", "19B", "22B"],
  freedom_strategist: ["13A", "16D", "21D", "23D"],
  legacy_builder: ["15D", "18C", "19D", "24D", "25D"],
};

function createIdentityScoreRecord(
  initialValue = 0,
): Record<CanonicalDnaIdentity, number> {
  return {
    [CANONICAL_DNA_IDENTITIES[0]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[1]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[2]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[3]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[4]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[5]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[6]]: initialValue,
    [CANONICAL_DNA_IDENTITIES[7]]: initialValue,
  };
}

function isDnaAnswerValue(value: unknown): value is DnaAnswerValue {
  return (
    typeof value === "string" &&
    ANSWER_VALUES.some((answerValue) => answerValue === value)
  );
}

function validateAnswerProfile(input: unknown): readonly EntrepreneurDnaResponse[] {
  if (!Array.isArray(input)) {
    throw new Error("Entrepreneur DNA answers must be an array");
  }
  if (input.length !== EXPECTED_ANSWER_COUNT) {
    throw new Error(
      `Entrepreneur DNA requires exactly ${EXPECTED_ANSWER_COUNT} answers; received ${input.length}`,
    );
  }

  const answersByQuestion = new Map<number, DnaAnswerValue>();

  for (const entry of input) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Each Entrepreneur DNA answer must be an object");
    }
    if (!("questionId" in entry) || !("value" in entry)) {
      throw new Error("Each answer requires questionId and value");
    }

    const questionId = entry.questionId;
    const value = entry.value;

    if (
      typeof questionId !== "number" ||
      !Number.isInteger(questionId) ||
      questionId < 1 ||
      questionId > EXPECTED_ANSWER_COUNT
    ) {
      throw new Error(
        `Unknown question ID; expected an integer from 1-${EXPECTED_ANSWER_COUNT}`,
      );
    }
    if (!isDnaAnswerValue(value)) {
      throw new Error("Answer value must be one of A/B/C/D");
    }
    if (answersByQuestion.has(questionId)) {
      throw new Error(`Question ${questionId} must be represented exactly once; duplicate found`);
    }

    answersByQuestion.set(questionId, value);
  }

  return Object.freeze(
    ENTREPRENEUR_DNA_V2_QUESTIONS.map((question) => {
      const value = answersByQuestion.get(question.id);
      if (value === undefined) {
        throw new Error(
          `Question ${question.id} must be represented exactly once; answer is missing`,
        );
      }
      return Object.freeze({ questionId: question.id, value });
    }),
  );
}

export function calculateRawScores(answers: unknown): IdentityScoreRecord {
  const validatedAnswers = validateAnswerProfile(answers);
  const rawScores = createIdentityScoreRecord();

  ENTREPRENEUR_DNA_V2_QUESTIONS.forEach((question, index) => {
    const answer = validatedAnswers[index];
    const selectedOption = question.options.find(
      (option) => option.value === answer.value,
    );
    if (selectedOption === undefined) {
      throw new Error(
        `Question ${question.id} does not define answer ${answer.value}`,
      );
    }

    for (const identity of CANONICAL_DNA_IDENTITIES) {
      rawScores[identity] += selectedOption.weights[identity] ?? 0;
    }
  });

  return Object.freeze(rawScores);
}

export function rankIdentityScores(
  rawScores: IdentityScoreRecord,
  calibratedScores: IdentityScoreRecord,
): readonly CanonicalDnaIdentity[] {
  return Object.freeze(
    [...CANONICAL_DNA_IDENTITIES].sort((left, right) => {
      const calibratedDifference =
        calibratedScores[right] - calibratedScores[left];
      if (calibratedDifference !== 0) {
        return calibratedDifference;
      }

      const leftNormalized = rawScores[left] / THEORETICAL_MAXIMA[left];
      const rightNormalized = rawScores[right] / THEORETICAL_MAXIMA[right];
      const normalizedDifference = rightNormalized - leftNormalized;
      if (normalizedDifference !== 0) {
        return normalizedDifference;
      }

      return (
        CANONICAL_DNA_IDENTITIES.indexOf(left) -
        CANONICAL_DNA_IDENTITIES.indexOf(right)
      );
    }),
  );
}

export function rankAnswerProfile(answers: unknown): RankedAnswerProfile {
  const validatedAnswers = validateAnswerProfile(answers);
  const rawScores = calculateRawScores(validatedAnswers);
  const calibratedScores = createIdentityScoreRecord();
  const facets = Object.fromEntries(
    CANONICAL_DNA_IDENTITIES.map((identity) => [identity, new Set<string>()]),
  ) as Record<CanonicalDnaIdentity, Set<string>>;
  const directFacets = Object.fromEntries(
    CANONICAL_DNA_IDENTITIES.map((identity) => [identity, new Set<string>()]),
  ) as Record<CanonicalDnaIdentity, Set<string>>;
  const constructEvidence = Object.fromEntries(
    CANONICAL_DNA_IDENTITIES.map((identity) => [identity, false]),
  ) as Record<CanonicalDnaIdentity, boolean>;

  validatedAnswers.forEach((answer, index) => {
    const question = ENTREPRENEUR_DNA_V2_QUESTIONS[index];
    const option = question.options.find((candidate) => candidate.value === answer.value)!;
    for (const identity of CANONICAL_DNA_IDENTITIES) {
      if ((option.weights[identity] ?? 0) > 0) {
        facets[identity].add(question.category);
        if ((option.weights[identity] ?? 0) >= 2) {
          directFacets[identity].add(question.category);
        }
        if (CONSTRUCT_OPTIONS[identity].includes(`${question.id}${answer.value}`)) {
          constructEvidence[identity] = true;
        }
      }
    }
  });
  const evidenceBreadth = Object.freeze(Object.fromEntries(
    CANONICAL_DNA_IDENTITIES.map((identity) => [identity, facets[identity].size]),
  ) as Record<CanonicalDnaIdentity, number>);
  const directEvidenceBreadth = Object.freeze(Object.fromEntries(
    CANONICAL_DNA_IDENTITIES.map((identity) => [identity, directFacets[identity].size]),
  ) as Record<CanonicalDnaIdentity, number>);

  for (const identity of CANONICAL_DNA_IDENTITIES) {
    calibratedScores[identity] = calculateCalibratedScore(
      CALIBRATION_TABLES[identity],
      rawScores[identity],
    );
  }

  const frozenCalibratedScores = Object.freeze(calibratedScores);
  const orderedIdentities = rankIdentityScores(
    rawScores,
    frozenCalibratedScores,
  );

  return Object.freeze({
    rawScores,
    calibratedScores: frozenCalibratedScores,
    evidenceBreadth,
    directEvidenceBreadth,
    constructEvidence: Object.freeze(constructEvidence),
    orderedIdentities,
    primaryIdentity: orderedIdentities[0],
    secondRankedIdentity: orderedIdentities[1],
  });
}

export function enumerateSingleAnswerNeighbors(
  answers: unknown,
): readonly (readonly EntrepreneurDnaResponse[])[] {
  const validatedAnswers = validateAnswerProfile(answers);
  const neighbors: (readonly EntrepreneurDnaResponse[])[] = [];

  validatedAnswers.forEach((selectedAnswer, selectedIndex) => {
    for (const alternativeValue of ANSWER_VALUES) {
      if (alternativeValue === selectedAnswer.value) {
        continue;
      }

      neighbors.push(
        Object.freeze(
          validatedAnswers.map((answer, index) =>
            index === selectedIndex
              ? Object.freeze({
                  questionId: answer.questionId,
                  value: alternativeValue,
                })
              : answer,
          ),
        ),
      );
    }
  });

  if (neighbors.length !== EXPECTED_NEIGHBOR_COUNT) {
    throw new Error(
      `Stability neighbor integrity mismatch: expected ${EXPECTED_NEIGHBOR_COUNT}, received ${neighbors.length}`,
    );
  }

  return Object.freeze(neighbors);
}

export function calculatePrimaryStability(
  answers: unknown,
  originalPrimary: CanonicalDnaIdentity,
  originalSecondary?: CanonicalDnaIdentity,
): PrimaryStabilityResult {
  const neighbors = enumerateSingleAnswerNeighbors(answers);
  let retainedPrimaryCount = 0;
  let retainedPairCount = 0;

  for (const neighbor of neighbors) {
    const ranking = rankAnswerProfile(neighbor);
    if (ranking.primaryIdentity === originalPrimary) {
      retainedPrimaryCount += 1;
    }
    if (
      originalSecondary &&
      ranking.orderedIdentities.slice(0, 2).includes(originalPrimary) &&
      ranking.orderedIdentities.slice(0, 2).includes(originalSecondary)
    ) {
      retainedPairCount += 1;
    }
  }

  return Object.freeze({
    primaryStabilityCount: retainedPrimaryCount,
    primaryStability: retainedPrimaryCount / neighbors.length,
    dualPairStabilityCount: retainedPairCount,
    neighborCount: neighbors.length,
  });
}

export function classifyRankedProfile(
  ranking: RankedAnswerProfile,
  stability: PrimaryStabilityResult,
): ClassificationResult {
  const primaryCalibratedScore =
    ranking.calibratedScores[ranking.primaryIdentity];
  const secondCalibratedScore =
    ranking.calibratedScores[ranking.secondRankedIdentity];
  const gap = primaryCalibratedScore - secondCalibratedScore;
  const hasEvidence = (identity: CanonicalDnaIdentity) =>
    ranking.directEvidenceBreadth[identity] >= CLASSIFICATION_THRESHOLDS.minimum_breadth &&
    ranking.constructEvidence[identity];

  // Frozen V1: Dual first; a stable pair may exchange first/second place.
  if (
    secondCalibratedScore >= CLASSIFICATION_THRESHOLDS.secondary_evidence_threshold &&
    gap <= CLASSIFICATION_THRESHOLDS.secondary_max_gap &&
    hasEvidence(ranking.primaryIdentity) &&
    hasEvidence(ranking.secondRankedIdentity) &&
    stability.dualPairStabilityCount >= CLASSIFICATION_THRESHOLDS.minimum_stable_neighbors
  ) {
    return Object.freeze({
      profileClassification: "dual",
      secondaryDna: ranking.secondRankedIdentity,
    });
  }

  if (
    primaryCalibratedScore >= CLASSIFICATION_THRESHOLDS.primary_evidence_threshold &&
    gap > CLASSIFICATION_THRESHOLDS.secondary_max_gap &&
    hasEvidence(ranking.primaryIdentity) &&
    stability.primaryStabilityCount >= CLASSIFICATION_THRESHOLDS.minimum_stable_neighbors
  ) {
    return Object.freeze({ profileClassification: "clear", secondaryDna: null });
  }

  return Object.freeze({ profileClassification: "blended", secondaryDna: null });
}

export function scoreEntrepreneurDnaV2(
  answers: unknown,
): EntrepreneurDnaV2Score {
  const ranking = rankAnswerProfile(answers);
  const stability = calculatePrimaryStability(
    answers,
    ranking.primaryIdentity,
    ranking.secondRankedIdentity,
  );
  const classification = classifyRankedProfile(
    ranking,
    stability,
  );

  return Object.freeze({
    ...ranking,
    ...stability,
    ...classification,
  });
}
