/**
 * Business dates and hours are in America/Bogota (UTC-5, no DST) while the server runs in UTC.
 * Prisma maps `@db.Date` to midnight UTC and `@db.Time` to 1970-01-01 UTC.
 */

const BOGOTA = "America/Bogota";

/** "YYYY-MM-DD" in Bogota. */
export const bogotaDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: BOGOTA }).format(date);

/** "HH:mm" in Bogota. */
export const bogotaTime = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: BOGOTA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);

export const bogotaHour = (date = new Date()) => Number(bogotaTime(date).slice(0, 2));

/** 0 = Sunday … 6 = Saturday for a "YYYY-MM-DD" date. */
export const dayOfWeek = (date: string) => new Date(date + "T12:00:00-05:00").getDay();

/** First and last instant of a Bogota day, as timestamptz bounds. */
export const bogotaDayStart = (date: string) => new Date(date + "T00:00:00-05:00");
export const bogotaDayEnd = (date: string) => new Date(date + "T23:59:59-05:00");

/** Today and today + 15 days: the reservation window. */
export function reservationDateBounds() {
  const min = bogotaDate();
  const last = new Date(min + "T12:00:00-05:00");
  last.setDate(last.getDate() + 15);
  return { min, max: bogotaDate(last) };
}

export const toDbDate = (date: string) => new Date(date + "T00:00:00Z");
export const fromDbDate = (date: Date) => date.toISOString().slice(0, 10);
export const toDbTime = (time: string) => new Date("1970-01-01T" + time + ":00Z");
export const fromDbTime = (time: Date) => time.toISOString().slice(11, 16);
