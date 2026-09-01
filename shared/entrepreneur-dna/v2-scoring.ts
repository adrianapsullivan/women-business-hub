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
  readonly orderedIdentities: readonly CanonicalDnaIdentity[];
  readonly primaryIdentity: CanonicalDnaIdentity;
  readonly secondRankedIdentity: CanonicalDnaIdentity;
}

export interface PrimaryStabilityResult {
  readonly primaryStabilityCount: number;
  readonly primaryStability: number;
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
  const rawScores = calculateRawScores(answers);
  const calibratedScores = createIdentityScoreRecord();

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
): PrimaryStabilityResult {
  const neighbors = enumerateSingleAnswerNeighbors(answers);
  let retainedPrimaryCount = 0;

  for (const neighbor of neighbors) {
    if (rankAnswerProfile(neighbor).primaryIdentity === originalPrimary) {
      retainedPrimaryCount += 1;
    }
  }

  return Object.freeze({
    primaryStabilityCount: retainedPrimaryCount,
    primaryStability: retainedPrimaryCount / neighbors.length,
    neighborCount: neighbors.length,
  });
}

export function classifyRankedProfile(
  ranking: RankedAnswerProfile,
  primaryStability: number,
): ClassificationResult {
  if (
    !Number.isFinite(primaryStability) ||
    primaryStability < 0 ||
    primaryStability > 1
  ) {
    throw new Error(
      `Primary stability must be between 0 and 1; received ${primaryStability}`,
    );
  }

  if (
    primaryStability <
    CLASSIFICATION_THRESHOLDS.primary_stability_threshold
  ) {
    return Object.freeze({
      profileClassification: "blended",
      secondaryDna: null,
    });
  }

  const primaryCalibratedScore =
    ranking.calibratedScores[ranking.primaryIdentity];
  const secondCalibratedScore =
    ranking.calibratedScores[ranking.secondRankedIdentity];

  if (
    secondCalibratedScore >=
      CLASSIFICATION_THRESHOLDS.secondary_evidence_threshold &&
    primaryCalibratedScore - secondCalibratedScore <=
      CLASSIFICATION_THRESHOLDS.secondary_max_gap
  ) {
    return Object.freeze({
      profileClassification: "dual",
      secondaryDna: ranking.secondRankedIdentity,
    });
  }

  return Object.freeze({
    profileClassification: "clear",
    secondaryDna: null,
  });
}

export function scoreEntrepreneurDnaV2(
  answers: unknown,
): EntrepreneurDnaV2Score {
  const ranking = rankAnswerProfile(answers);
  const stability = calculatePrimaryStability(
    answers,
    ranking.primaryIdentity,
  );
  const classification = classifyRankedProfile(
    ranking,
    stability.primaryStability,
  );

  return Object.freeze({
    ...ranking,
    ...stability,
    ...classification,
  });
}
