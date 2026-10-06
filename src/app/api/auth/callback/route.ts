import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { startSession } from "@/features/auth/lib/session";
import { createUser, findUserByEmail } from "@/features/auth/services/user.service";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedPath = request.nextUrl.searchParams.get("next");
  const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  let localUserId = (await findUserByEmail(user.email))?.id;
  if (!localUserId) {
    try {
      // OAuth accounts have no password; Usuario.auth_id links them to Supabase Auth.
      localUserId = (await createUser({ email: user.email, fullName: String(user.user_metadata.full_name ?? user.user_metadata.name ?? user.email.split("@")[0]), passwordHash: null, authProvider: String(user.app_metadata.provider ?? "oauth"), authId: user.id })).id;
    } catch {
      localUserId = (await findUserByEmail(user.email))?.id;
    }
  }
  if (!localUserId) return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  await startSession(localUserId);
  return NextResponse.redirect(new URL(nextPath, request.url));
}
