import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { startSession } from "@/features/auth/lib/session";
import { createUser, findUserByEmail } from "@/features/auth/services/user.service";

export async function GET(request: NextRequest) {
  // APP_URL is the public origin behind reverse proxies. request.url may contain
  // the container address (for example, http://0.0.0.0:3000) instead.
  const publicOrigin = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : request.nextUrl.origin;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, publicOrigin));
  const code = request.nextUrl.searchParams.get("code");
  const requestedPath = request.nextUrl.searchParams.get("next");
  const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
  if (!code) return redirectTo("/login?error=oauth");
  // Supabase is only used to verify the OAuth code; startSession issues the app cookie.
  const supabase = await createSupabaseServerClient({ persistSession: false });
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !user?.email) return redirectTo("/login?error=oauth");
  let localUserId = (await findUserByEmail(user.email))?.id;
  if (!localUserId) {
    try {
      // OAuth accounts have no password; Usuario.auth_id links them to Supabase Auth.
      localUserId = (await createUser({ email: user.email, fullName: String(user.user_metadata.full_name ?? user.user_metadata.name ?? user.email.split("@")[0]), passwordHash: null, authProvider: String(user.app_metadata.provider ?? "oauth"), authId: user.id })).id;
    } catch {
      localUserId = (await findUserByEmail(user.email))?.id;
    }
  }
  if (!localUserId) return redirectTo("/login?error=oauth");
  await startSession(localUserId);
  return redirectTo(nextPath);
}
