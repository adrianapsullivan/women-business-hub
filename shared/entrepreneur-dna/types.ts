export const ASSESSMENT_VERSION = "1.0-beta" as const;
export const SCORING_VERSION = "1.0-beta" as const;
export const CALIBRATION_VERSION = "1.0-beta-null-uniform" as const;

export const CANONICAL_DNA_IDENTITIES = [
  "strategic_builder",
  "visionary_leader",
  "influence_creator",
  "community_builder",
  "knowledge_authority",
  "action_taker",
  "freedom_strategist",
  "legacy_builder",
] as const;

export type CanonicalDnaIdentity = (typeof CANONICAL_DNA_IDENTITIES)[number];

export const DNA_DISPLAY_NAMES: Readonly<Record<CanonicalDnaIdentity, string>> = {
  strategic_builder: "Strategic Builder",
  visionary_leader: "Visionary Leader",
  influence_creator: "Influence Creator",
  community_builder: "Community Builder",
  knowledge_authority: "Knowledge Authority",
  action_taker: "Action Taker",
  freedom_strategist: "Freedom Strategist",
  legacy_builder: "Legacy Builder",
};

export type DnaAnswerValue = "A" | "B" | "C" | "D";
export type EvidenceWeight = 1 | 2 | 3;
export type DnaEvidenceWeights = Readonly<
  Partial<Record<CanonicalDnaIdentity, EvidenceWeight>>
>;

export interface EntrepreneurDnaAnswerOption {
  readonly value: DnaAnswerValue;
  readonly title?: string;
  readonly label: string;
  readonly weights: DnaEvidenceWeights;
}

export interface EntrepreneurDnaQuestion {
  readonly id: number;
  readonly category: string;
  readonly question: string;
  readonly options: readonly EntrepreneurDnaAnswerOption[];
  readonly beta_analysis?: Readonly<{
    possible_redundancy_with_q13?: boolean;
  }>;
}

export interface ClassificationThresholds {
  readonly minimum_breadth: number;
  readonly minimum_stable_neighbors: number;
  readonly primary_evidence_threshold: number;
  readonly secondary_evidence_threshold: number;
  readonly secondary_max_gap: number;
}

export const CLASSIFICATION_THRESHOLDS_BY_SCORING_VERSION: Readonly<
  Record<typeof SCORING_VERSION, ClassificationThresholds>
> = {
  "1.0-beta": {
    minimum_breadth: 3,
    minimum_stable_neighbors: 53,
    primary_evidence_threshold: 80,
    secondary_evidence_threshold: 80,
    secondary_max_gap: 8,
  },
};

export const CLASSIFICATION_THRESHOLDS =
  CLASSIFICATION_THRESHOLDS_BY_SCORING_VERSION[SCORING_VERSION];
