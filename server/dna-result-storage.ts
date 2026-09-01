import type {
  CanonicalDnaV2ResultPayload,
  DnaResultRepository,
  StoredDnaResult,
} from "./dna-result-service";
import { getSupabaseAdminClient } from "./supabase";

const TABLE_NAME = "entrepreneur_dna_results";

type DnaResultRow = Record<string, any>;
type SupabaseQueryError = { message: string; code?: string };

function fromDatabaseRow(row: DnaResultRow): StoredDnaResult {
  return Object.freeze({
    id: row.id,
    completionKey: row.completion_key,
    firstName: row.first_name,
    email: row.email,
    emailNormalized: row.email_normalized,
    assessmentVersion: row.assessment_version,
    scoringVersion: row.scoring_version,
    calibrationVersion: row.calibration_version,
    primaryDna: row.primary_dna,
    secondaryDna: row.secondary_dna,
    profileClassification: row.profile_classification,
    answers: Object.freeze(row.answers),
    resultPayload: Object.freeze(
      row.result_payload as CanonicalDnaV2ResultPayload,
    ),
    reportAccessTokenHash: row.report_access_token_hash,
    reportAccessExpiresAt: row.report_access_expires_at,
    reportAccessRevokedAt: row.report_access_revoked_at,
    ownerUserId: row.owner_user_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toDatabaseRow(record: StoredDnaResult) {
  return {
    id: record.id,
    completion_key: record.completionKey,
    first_name: record.firstName,
    email: record.email,
    email_normalized: record.emailNormalized,
    assessment_version: record.assessmentVersion,
    scoring_version: record.scoringVersion,
    calibration_version: record.calibrationVersion,
    primary_dna: record.primaryDna,
    secondary_dna: record.secondaryDna,
    profile_classification: record.profileClassification,
    answers: record.answers,
    result_payload: record.resultPayload,
    report_access_token_hash: record.reportAccessTokenHash,
    report_access_expires_at: record.reportAccessExpiresAt,
    report_access_revoked_at: record.reportAccessRevokedAt,
    owner_user_id: record.ownerUserId,
    claimed_at: record.claimedAt,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

async function maybeSingleResult(
  query: PromiseLike<{
    data: DnaResultRow | null;
    error: SupabaseQueryError | null;
  }>,
): Promise<StoredDnaResult | null> {
  const { data, error } = await query;
  if (error) {
    throw Object.assign(new Error(error.message), { code: error.code });
  }
  return data ? fromDatabaseRow(data) : null;
}

export const supabaseDnaResultRepository: DnaResultRepository = {
  async findByCompletionKey(completionKey) {
    return maybeSingleResult(
      getSupabaseAdminClient()
        .from(TABLE_NAME)
        .select("*")
        .eq("completion_key", completionKey)
        .maybeSingle(),
    );
  },

  async insert(record) {
    const { data, error } = await getSupabaseAdminClient()
      .from(TABLE_NAME)
      .insert(toDatabaseRow(record))
      .select("*")
      .single();
    if (error) {
      throw Object.assign(new Error(error.message), { code: error.code });
    }
    return fromDatabaseRow(data);
  },

  async findByReportTokenHash(reportTokenHash) {
    return maybeSingleResult(
      getSupabaseAdminClient()
        .from(TABLE_NAME)
        .select("*")
        .eq("report_access_token_hash", reportTokenHash)
        .maybeSingle(),
    );
  },

  async findByOwnerUserId(ownerUserId) {
    return maybeSingleResult(
      getSupabaseAdminClient()
        .from(TABLE_NAME)
        .select("*")
        .eq("owner_user_id", ownerUserId)
        .maybeSingle(),
    );
  },

  async rotateReportAccess(
    resultId,
    reportAccessTokenHash,
    reportAccessExpiresAt,
    updatedAt,
  ) {
    return maybeSingleResult(
      getSupabaseAdminClient()
        .from(TABLE_NAME)
        .update({
          report_access_token_hash: reportAccessTokenHash,
          report_access_expires_at: reportAccessExpiresAt,
          report_access_revoked_at: null,
          updated_at: updatedAt,
        })
        .eq("id", resultId)
        .is("owner_user_id", null)
        .is("claimed_at", null)
        .is("report_access_revoked_at", null)
        .select("*")
        .maybeSingle(),
    );
  },

  async claimIfUnowned(
    resultId,
    ownerUserId,
    claimedAt,
    reportAccessRevokedAt,
  ) {
    return maybeSingleResult(
      getSupabaseAdminClient()
        .from(TABLE_NAME)
        .update({
          owner_user_id: ownerUserId,
          claimed_at: claimedAt,
          report_access_revoked_at: reportAccessRevokedAt,
          updated_at: claimedAt,
        })
        .eq("id", resultId)
        .is("owner_user_id", null)
        .select("*")
        .maybeSingle(),
    );
  },
};
