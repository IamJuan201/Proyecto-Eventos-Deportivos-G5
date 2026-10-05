import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Stripe aún no está configurado para esta demo." },
    { status: 503 },
  );
}
