export type AccessTokenProvider = () => Promise<string | null>;
export type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function createAuthenticatedFetch(
  getAccessToken: AccessTokenProvider,
  fetchImplementation: FetchImplementation = fetch,
): FetchImplementation {
  return async (input, init = {}) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Authenticated Supabase session required");
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);

    return fetchImplementation(input, {
      ...init,
      headers,
    });
  };
}

async function getSupabaseAccessToken(): Promise<string | null> {
  const { default: supabase } = await import("./supabase");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export const authenticatedFetch = createAuthenticatedFetch(
  getSupabaseAccessToken,
);
