import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/shared/lib/supabase/config";

/**
 * @param options.persistSession false keeps the Supabase session in memory only: cookie
 * deletions (such as the PKCE code verifier) still apply, but no `sb-*-auth-token` cookie is
 * written. The app keeps its own session cookie, and those chunked tokens make the response
 * headers exceed the reverse proxy buffer (nginx answers 502).
 */
export async function createSupabaseServerClient(options: { persistSession?: boolean } = {}) {
  const { persistSession = true } = options;
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            if (persistSession || value === "") cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components no pueden modificar cookies durante el renderizado.
        }
      },
    },
  });
}
