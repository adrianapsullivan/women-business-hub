export type ReportAuthState = "loading" | "guest" | "pending" | "unlocked" | "error";

export interface ReportAuthUser {
  id?: string | null;
  email?: string | null;
  email_confirmed_at?: string | null;
}

export function readFreshReportUser<T extends ReportAuthUser>({
  data,
  error,
}: {
  data: { user: T | null };
  error: { name: string } | null;
}): T | null {
  if (error?.name === "AuthSessionMissingError") return null;
  if (error) throw error;
  return data.user;
}

export function createReportAuthGate({
  getUser,
  onStateChange,
  onUnlock,
}: {
  getUser: () => Promise<ReportAuthUser | null>;
  onStateChange: (state: ReportAuthState, user?: ReportAuthUser) => void;
  onUnlock: (user: ReportAuthUser & { id: string }) => void;
}) {
  let generation = 0;
  let disposed = false;
  let savedUserId: string | null = null;

  async function validate(): Promise<void> {
    if (disposed) return;
    const current = ++generation;
    onStateChange("loading");

    try {
      const user = await getUser();
      if (disposed || current !== generation) return;

      if (!user || typeof user.id !== "string" || !user.id.trim()) {
        onStateChange("guest");
      } else if (!user.email_confirmed_at) {
        onStateChange("pending", user);
      } else {
        const validUser = { ...user, id: user.id.trim() };
        if (savedUserId !== validUser.id) {
          onUnlock(validUser);
          savedUserId = validUser.id;
        }
        onStateChange("unlocked", validUser);
      }
    } catch {
      if (!disposed && current === generation) {
        onStateChange("error");
      }
    }
  }

  function signOut(): void {
    if (disposed) return;
    ++generation;
    onStateChange("guest");
  }

  function dispose(): void {
    ++generation;
    disposed = true;
  }

  return { validate, signOut, dispose };
}