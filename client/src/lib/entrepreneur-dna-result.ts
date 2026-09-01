import type { BusinessScores, DNAType } from "./quiz-data";
import {
  ASSESSMENT_VERSION,
  CALIBRATION_VERSION,
  CANONICAL_DNA_IDENTITIES,
  SCORING_VERSION,
  type CanonicalDnaIdentity,
  type DnaAnswerValue,
} from "../../../shared/entrepreneur-dna/types";
import type {
  EntrepreneurDnaResponse,
  IdentityScoreRecord as SharedIdentityScoreRecord,
  ProfileClassification,
} from "../../../shared/entrepreneur-dna/v2-scoring";

const EXPECTED_ANSWER_COUNT = 25;
const EXPECTED_NEIGHBOR_COUNT = 75;

const CANONICAL_TO_LEGACY_DNA_TYPE: Readonly<
  Record<CanonicalDnaIdentity, DNAType>
> = {
  strategic_builder: "Strategic Builder",
  visionary_leader: "Visionary Leader",
  influence_creator: "Influence Creator",
  community_builder: "Community Builder",
  knowledge_authority: "Knowledge Authority",
  action_taker: "Action Taker",
  freedom_strategist: "Freedom Strategist",
  legacy_builder: "Legacy Builder",
};

export type IdentityScoreRecord = SharedIdentityScoreRecord;

export interface LegacyEntrepreneurDnaResult {
  readonly dnaType: DNAType;
  readonly secondaryDnaType?: DNAType | null;
  readonly businessScores?: BusinessScores;
}

export interface EntrepreneurDnaV2ClientResult {
  readonly answers: readonly EntrepreneurDnaResponse[];
  readonly raw_scores: IdentityScoreRecord;
  readonly calibrated_scores: IdentityScoreRecord;
  readonly primary_dna: CanonicalDnaIdentity;
  readonly secondary_dna: CanonicalDnaIdentity | null;
  readonly profile_classification: ProfileClassification;
  readonly primary_stability: number;
  readonly primary_stability_count: number;
  readonly assessment_version: typeof ASSESSMENT_VERSION;
  readonly scoring_version: typeof SCORING_VERSION;
  readonly calibration_version: typeof CALIBRATION_VERSION;
}

export type ClientEntrepreneurDnaResult =
  | LegacyEntrepreneurDnaResult
  | EntrepreneurDnaV2ClientResult;

export interface LegacyClientDnaDisplayResult {
  readonly resultVersion: "legacy";
  readonly primaryDnaType: DNAType;
  readonly secondaryDnaType: DNAType | null;
}

export interface V2ClientDnaDisplayResult {
  readonly resultVersion: typeof ASSESSMENT_VERSION;
  readonly primaryDnaType: DNAType;
  readonly secondaryDnaType: DNAType | null;
  readonly profileClassification: ProfileClassification;
}

export type ClientDnaDisplayResult =
  | LegacyClientDnaDisplayResult
  | V2ClientDnaDisplayResult;

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCanonicalDnaIdentity(
  value: unknown,
): value is CanonicalDnaIdentity {
  return (
    typeof value === "string" &&
    CANONICAL_DNA_IDENTITIES.some((identity) => identity === value)
  );
}

function isDnaAnswerValue(value: unknown): value is DnaAnswerValue {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function isLegacyDnaType(value: unknown): value is DNAType {
  return (
    typeof value === "string" &&
    Object.values(CANONICAL_TO_LEGACY_DNA_TYPE).some(
      (legacyType) => legacyType === value,
    )
  );
}

function isBusinessScores(value: unknown): value is BusinessScores {
  return (
    isObject(value) &&
    "affiliate" in value &&
    isFiniteNumber(value.affiliate) &&
    "digital" in value &&
    isFiniteNumber(value.digital) &&
    "personalBrand" in value &&
    isFiniteNumber(value.personalBrand) &&
    "knowledge" in value &&
    isFiniteNumber(value.knowledge) &&
    "community" in value &&
    isFiniteNumber(value.community)
  );
}

function isAnswerProfile(value: unknown): value is readonly EntrepreneurDnaResponse[] {
  if (!Array.isArray(value) || value.length !== EXPECTED_ANSWER_COUNT) {
    return false;
  }

  const questionIds = new Set<number>();
  for (const answer of value) {
    if (
      !isObject(answer) ||
      !("questionId" in answer) ||
      typeof answer.questionId !== "number" ||
      !Number.isInteger(answer.questionId) ||
      answer.questionId < 1 ||
      answer.questionId > EXPECTED_ANSWER_COUNT ||
      questionIds.has(answer.questionId) ||
      !("value" in answer) ||
      !isDnaAnswerValue(answer.value)
    ) {
      return false;
    }
    questionIds.add(answer.questionId);
  }

  return questionIds.size === EXPECTED_ANSWER_COUNT;
}

function hasExactlyCanonicalScoreKeys(value: object): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === CANONICAL_DNA_IDENTITIES.length &&
    CANONICAL_DNA_IDENTITIES.every((identity) => keys.includes(identity))
  );
}

function isRawScoreRecord(value: unknown): value is IdentityScoreRecord {
  return (
    isObject(value) &&
    hasExactlyCanonicalScoreKeys(value) &&
    "strategic_builder" in value &&
    isFiniteNumber(value.strategic_builder) &&
    Number.isInteger(value.strategic_builder) &&
    value.strategic_builder >= 0 &&
    "visionary_leader" in value &&
    isFiniteNumber(value.visionary_leader) &&
    Number.isInteger(value.visionary_leader) &&
    value.visionary_leader >= 0 &&
    "influence_creator" in value &&
    isFiniteNumber(value.influence_creator) &&
    Number.isInteger(value.influence_creator) &&
    value.influence_creator >= 0 &&
    "community_builder" in value &&
    isFiniteNumber(value.community_builder) &&
    Number.isInteger(value.community_builder) &&
    value.community_builder >= 0 &&
    "knowledge_authority" in value &&
    isFiniteNumber(value.knowledge_authority) &&
    Number.isInteger(value.knowledge_authority) &&
    value.knowledge_authority >= 0 &&
    "action_taker" in value &&
    isFiniteNumber(value.action_taker) &&
    Number.isInteger(value.action_taker) &&
    value.action_taker >= 0 &&
    "freedom_strategist" in value &&
    isFiniteNumber(value.freedom_strategist) &&
    Number.isInteger(value.freedom_strategist) &&
    value.freedom_strategist >= 0 &&
    "legacy_builder" in value &&
    isFiniteNumber(value.legacy_builder) &&
    Number.isInteger(value.legacy_builder) &&
    value.legacy_builder >= 0
  );
}

function isCalibratedScore(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function isCalibratedScoreRecord(
  value: unknown,
): value is IdentityScoreRecord {
  return (
    isObject(value) &&
    hasExactlyCanonicalScoreKeys(value) &&
    "strategic_builder" in value &&
    isCalibratedScore(value.strategic_builder) &&
    "visionary_leader" in value &&
    isCalibratedScore(value.visionary_leader) &&
    "influence_creator" in value &&
    isCalibratedScore(value.influence_creator) &&
    "community_builder" in value &&
    isCalibratedScore(value.community_builder) &&
    "knowledge_authority" in value &&
    isCalibratedScore(value.knowledge_authority) &&
    "action_taker" in value &&
    isCalibratedScore(value.action_taker) &&
    "freedom_strategist" in value &&
    isCalibratedScore(value.freedom_strategist) &&
    "legacy_builder" in value &&
    isCalibratedScore(value.legacy_builder)
  );
}

function isProfileClassification(
  value: unknown,
): value is ProfileClassification {
  return value === "clear" || value === "dual" || value === "blended";
}

export function isLegacyEntrepreneurDnaResult(
  value: unknown,
): value is LegacyEntrepreneurDnaResult {
  if (
    !isObject(value) ||
    "assessment_version" in value ||
    "scoring_version" in value ||
    "calibration_version" in value ||
    !("dnaType" in value) ||
    !isLegacyDnaType(value.dnaType)
  ) {
    return false;
  }

  if (
    "secondaryDnaType" in value &&
    value.secondaryDnaType !== undefined &&
    value.secondaryDnaType !== null &&
    !isLegacyDnaType(value.secondaryDnaType)
  ) {
    return false;
  }

  return !(
    "businessScores" in value &&
    value.businessScores !== undefined &&
    !isBusinessScores(value.businessScores)
  );
}

export function isEntrepreneurDnaV2ClientResult(
  value: unknown,
): value is EntrepreneurDnaV2ClientResult {
  if (
    !isObject(value) ||
    !("assessment_version" in value) ||
    value.assessment_version !== ASSESSMENT_VERSION ||
    !("scoring_version" in value) ||
    value.scoring_version !== SCORING_VERSION ||
    !("calibration_version" in value) ||
    value.calibration_version !== CALIBRATION_VERSION ||
    !("answers" in value) ||
    !isAnswerProfile(value.answers) ||
    !("raw_scores" in value) ||
    !isRawScoreRecord(value.raw_scores) ||
    !("calibrated_scores" in value) ||
    !isCalibratedScoreRecord(value.calibrated_scores) ||
    !("primary_dna" in value) ||
    !isCanonicalDnaIdentity(value.primary_dna) ||
    !("secondary_dna" in value) ||
    !("profile_classification" in value) ||
    !isProfileClassification(value.profile_classification) ||
    !("primary_stability" in value) ||
    !isFiniteNumber(value.primary_stability) ||
    value.primary_stability < 0 ||
    value.primary_stability > 1 ||
    !("primary_stability_count" in value) ||
    typeof value.primary_stability_count !== "number" ||
    !Number.isInteger(value.primary_stability_count) ||
    value.primary_stability_count < 0 ||
    value.primary_stability_count > EXPECTED_NEIGHBOR_COUNT ||
    value.primary_stability !==
      value.primary_stability_count / EXPECTED_NEIGHBOR_COUNT
  ) {
    return false;
  }

  if (value.profile_classification === "dual") {
    return (
      isCanonicalDnaIdentity(value.secondary_dna) &&
      value.secondary_dna !== value.primary_dna
    );
  }

  return value.secondary_dna === null;
}

export function readClientEntrepreneurDnaResult(
  value: unknown,
): ClientEntrepreneurDnaResult | null {
  if (isEntrepreneurDnaV2ClientResult(value)) {
    return value;
  }
  if (isLegacyEntrepreneurDnaResult(value)) {
    return value;
  }
  return null;
}

export function toClientDnaDisplayResult(
  result: ClientEntrepreneurDnaResult,
): ClientDnaDisplayResult {
  if (isEntrepreneurDnaV2ClientResult(result)) {
    return Object.freeze({
      resultVersion: ASSESSMENT_VERSION,
      primaryDnaType: CANONICAL_TO_LEGACY_DNA_TYPE[result.primary_dna],
      secondaryDnaType:
        result.secondary_dna === null
          ? null
          : CANONICAL_TO_LEGACY_DNA_TYPE[result.secondary_dna],
      profileClassification: result.profile_classification,
    });
  }

  return Object.freeze({
    resultVersion: "legacy",
    primaryDnaType: result.dnaType,
    secondaryDnaType: result.secondaryDnaType ?? null,
  });
}
