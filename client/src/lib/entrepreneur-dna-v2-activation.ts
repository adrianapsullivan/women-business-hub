import {
  ASSESSMENT_VERSION,
  CALIBRATION_VERSION,
  SCORING_VERSION,
} from "../../../shared/entrepreneur-dna/types";
import { ENTREPRENEUR_DNA_V2_QUESTIONS } from "../../../shared/entrepreneur-dna/v2-matrix";
import {
  scoreEntrepreneurDnaV2,
  type EntrepreneurDnaResponse,
} from "../../../shared/entrepreneur-dna/v2-scoring";
import {
  isEntrepreneurDnaV2ClientResult,
  isLegacyEntrepreneurDnaResult,
  readClientEntrepreneurDnaResult,
  type ClientEntrepreneurDnaResult,
  type EntrepreneurDnaV2ClientResult,
} from "./entrepreneur-dna-result";

export const LEGACY_RESULT_STORAGE_KEY = "wbe_result";
// Keep V1 completion/progress separate from earlier V2 answers. A partially
// completed V2 questionnaire must never resume against the frozen V1 matrix.
export const V2_RESULT_STORAGE_KEY = "wbe_entrepreneur_dna_v1_result";
export const V2_ANSWERS_STORAGE_KEY = "wbe_entrepreneur_dna_v1_answers";
export const V2_PROGRESS_STORAGE_KEY = "wbe_entrepreneur_dna_v1_progress";

export const ACTIVE_ENTREPRENEUR_DNA_V2_QUESTIONS =
  ENTREPRENEUR_DNA_V2_QUESTIONS;

export function createEntrepreneurDnaV2Result(
  answers: readonly EntrepreneurDnaResponse[],
): EntrepreneurDnaV2ClientResult {
  const scoring = scoreEntrepreneurDnaV2(answers);
  const result: EntrepreneurDnaV2ClientResult = {
    answers: Object.freeze(
      answers.map((answer) =>
        Object.freeze({
          questionId: answer.questionId,
          value: answer.value,
        }),
      ),
    ),
    raw_scores: scoring.rawScores,
    calibrated_scores: scoring.calibratedScores,
    primary_dna: scoring.primaryIdentity,
    secondary_dna: scoring.secondaryDna,
    profile_classification: scoring.profileClassification,
    primary_stability: scoring.primaryStability,
    primary_stability_count: scoring.primaryStabilityCount,
    assessment_version: ASSESSMENT_VERSION,
    scoring_version: SCORING_VERSION,
    calibration_version: CALIBRATION_VERSION,
  };

  if (!isEntrepreneurDnaV2ClientResult(result)) {
    throw new Error("Generated Entrepreneur DNA V2 result failed client validation");
  }

  return Object.freeze(result);
}

function parseJson(value: string | null): unknown {
  if (value === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    return null;
  }
}

export function readActiveClientDnaResult(
  v2ResultJson: string | null,
  legacyResultJson: string | null,
): ClientEntrepreneurDnaResult | null {
  const v2Candidate = parseJson(v2ResultJson);
  if (isEntrepreneurDnaV2ClientResult(v2Candidate)) {
    return v2Candidate;
  }

  return readClientEntrepreneurDnaResult(parseJson(legacyResultJson));
}

export function isLegacyBusinessPathAllowed(
  result: ClientEntrepreneurDnaResult,
): boolean {
  return isLegacyEntrepreneurDnaResult(result);
}

export function getSafeDnaRoute(
  requestedRoute: string,
  result: ClientEntrepreneurDnaResult,
): string {
  if (
    isEntrepreneurDnaV2ClientResult(result) &&
    (requestedRoute === "/compatibility" || requestedRoute === "/foundation")
  ) {
    return "/report";
  }

  return requestedRoute;
}

export function getPostReportRoute(
  result: ClientEntrepreneurDnaResult,
): "/compatibility" | "/dashboard" {
  return isEntrepreneurDnaV2ClientResult(result)
    ? "/dashboard"
    : "/compatibility";
}
