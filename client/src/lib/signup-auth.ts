export interface SignupAuthUser {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}

export function getValidSignupUser<T extends { id?: string | null }>(
  data: { user?: T | null } | null | undefined,
): (T & { id: string }) | null {
  const user = data?.user;
  if (!user || typeof user.id !== "string" || user.id.trim() === "") {
    return null;
  }

  return user as T & { id: string };
}

export async function runCancellableAuthenticatedRouting<TSync, TProgress>({
  isCancelled,
  synchronize,
  loadProgress,
  commit,
}: {
  isCancelled: () => boolean;
  synchronize: () => Promise<TSync>;
  loadProgress: () => Promise<TProgress>;
  commit: (syncResult: TSync, progress: TProgress) => void;
}): Promise<"routed" | "cancelled"> {
  if (isCancelled()) {
    return "cancelled";
  }

  const syncResult = await synchronize();
  if (isCancelled()) {
    return "cancelled";
  }

  const progress = await loadProgress();
  if (isCancelled()) {
    return "cancelled";
  }

  commit(syncResult, progress);
  return "routed";
}

export async function resolveInitialSignupAuth<T extends SignupAuthUser>(
  getUser: () => Promise<{ user: T | null }>,
  routeAuthenticatedUser: (user: T) => Promise<void>,
  isCancelled: () => boolean = () => false,
): Promise<"ready" | "redirected" | "cancelled" | "error"> {
  try {
    const { user } = await getUser();

    if (isCancelled()) {
      return "cancelled";
    }

    if (user?.email_confirmed_at) {
      await routeAuthenticatedUser(user);
      return "redirected";
    }

    return "ready";
  } catch {
    return "error";
  }
}
