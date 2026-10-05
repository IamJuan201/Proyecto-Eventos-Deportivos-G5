import { NextResponse } from "next/server";
import { clearJsonSession } from "@/features/auth/lib/json-auth";

export async function POST() {
  await clearJsonSession();
  return NextResponse.json({ success: true });
}
