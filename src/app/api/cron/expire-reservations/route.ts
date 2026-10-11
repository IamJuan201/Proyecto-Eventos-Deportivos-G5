import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireStaleReservations } from "@/features/reservations/services/reservation.service";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Called every 5 minutes by the server cron with `Authorization: Bearer <CRON_SECRET>`. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ message: "CRON_SECRET no está configurado." }, { status: 503 });
  const received = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(digest(received), digest(`Bearer ${secret}`))) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const expired = await expireStaleReservations();
  return NextResponse.json({ expired });
}
