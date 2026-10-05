import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createJsonUser, getJsonUserByEmail } from "@/shared/lib/demo-store";
import { startJsonSession } from "@/features/auth/lib/json-auth";

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
  let localUser = await getJsonUserByEmail(user.email);
  if (!localUser) {
    try {
      await createJsonUser({ email: user.email, fullName: String(user.user_metadata.full_name ?? user.user_metadata.name ?? user.email.split("@")[0]), passwordHash: `oauth:${user.app_metadata.provider ?? "provider"}` });
      localUser = await getJsonUserByEmail(user.email);
    } catch {
      localUser = await getJsonUserByEmail(user.email);
    }
  }
  if (!localUser) return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  await startJsonSession(localUser.id);
  return NextResponse.redirect(new URL(nextPath, request.url));
}
