import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type DemoCategory = { id: string; name: string; description: string; isActive: boolean; createdAt: string; artwork?: string };
export type DemoService = {
  id: string; categoryId: string; name: string; description: string; imageUrl: string; price: number;
  durationMinutes: number; capacity: number; capacityPeople: number; operatingDays: number[];
  isActive: boolean; createdAt: string; chargeType: "por_hora" | "por_persona";
  qrType: "individual" | "grupal"; artwork: string; tag: string;
};
export type DemoServiceInput = Pick<DemoService, "categoryId" | "name" | "description" | "imageUrl" | "price" | "durationMinutes" | "capacity" | "capacityPeople" | "operatingDays" | "chargeType" | "qrType">;
export type DemoReservation = {
  id: string; customerName: string; customerEmail: string; customerIdNumber: string;
  serviceId: string; serviceName: string; date: string; startTime: string; endTime: string;
  quantity: number; people: number; status: "pendiente_pago" | "pagada" | "expirada";
  subtotal: number; discount: number; total: number; paymentExpiresAt: string;
  createdAt: string; termsVersion: string; containsMinor: boolean; responsibleAdult: string | null;
};
export type DemoPayment = { id: string; reservationId: string; reference: string; amount: number; method: string; status: "aprobado"; paidAt: string };
export type DemoQr = { id: string; reservationId: string; code: string; type: "individual" | "grupal"; used: boolean; usedAt: string | null };
export type AccessResult = "permitido" | "rechazado_menor" | "qr_invalido" | "reserva_no_pagada" | "servicio_incorrecto" | "fuera_de_horario" | "qr_usado";
export type DemoEmployee = { id: string; name: string; email: string; serviceId: string; isActive: boolean; lastActivity: string | null };
export type DemoDatabase = {
  categories: DemoCategory[]; services: DemoService[]; reservations: DemoReservation[]; payments: DemoPayment[];
  employees: DemoEmployee[];
  qrs: DemoQr[]; accessLogs: { id: string; code: string; serviceId: string; employeeId?: string; result: AccessResult; createdAt: string }[];
  closures: { serviceId: string; from: string; to: string; reason: string }[]; termsVersion: string;
  users: DemoUser[]; sessions: DemoSession[];
};
export type DemoUser = { id: string; email: string; fullName: string; passwordHash: string; role: "admin" | "empleado" | "cliente"; createdAt: string };
export type DemoSession = { token: string; userId: string; expiresAt: string };

const dataPath = path.join(process.cwd(), "data", "elite-club-demo.json");
const tempPath = dataPath + "." + process.pid + ".tmp";
type DemoGlobal = typeof globalThis & { __eliteClubQueue?: Promise<unknown> };

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const global = globalThis as DemoGlobal;
  const previous = global.__eliteClubQueue ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(work);
  global.__eliteClubQueue = current.catch(() => undefined);
  return current;
}

async function readDatabase(): Promise<DemoDatabase> {
  try {
    const database = JSON.parse(await readFile(dataPath, "utf8")) as Partial<DemoDatabase>;
    return { ...database, categories: database.categories ?? [], services: database.services ?? [], reservations: database.reservations ?? [], payments: database.payments ?? [], employees: database.employees ?? [], qrs: database.qrs ?? [], accessLogs: database.accessLogs ?? [], closures: database.closures ?? [], termsVersion: database.termsVersion ?? "2026-10-01", users: database.users ?? [], sessions: database.sessions ?? [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const initial: DemoDatabase = { categories: [], services: [], reservations: [], payments: [], employees: [], qrs: [], accessLogs: [], closures: [], termsVersion: "2026-10-01", users: [], sessions: [] };
    await writeDatabase(initial);
    return initial;
  }
}

export async function createJsonUser(input: { email: string; fullName: string; passwordHash: string; role?: "admin" | "empleado" | "cliente" }) {
  return serialize(async () => {
    const db = await readDatabase();
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Escribe un correo válido.");
    if (input.fullName.trim().length < 3) throw new Error("Escribe tu nombre completo.");
    if (db.users.some((user) => user.email === email)) throw new Error("Ya existe una cuenta con ese correo.");
    const user: DemoUser = { id: randomUUID(), email, fullName: input.fullName.trim(), passwordHash: input.passwordHash, role: input.role ?? "cliente", createdAt: new Date().toISOString() };
    db.users.push(user);
    await writeDatabase(db);
    return clone({ id: user.id, email: user.email, fullName: user.fullName });
  });
}

export async function getJsonUserByEmail(email: string) {
  return (await readDemoDatabase()).users.find((user) => user.email === email.trim().toLowerCase()) ?? null;
}

export async function saveJsonSession(session: DemoSession) {
  return serialize(async () => { const db = await readDatabase(); db.sessions = db.sessions.filter((item) => item.userId !== session.userId && new Date(item.expiresAt).getTime() > Date.now()); db.sessions.push(session); await writeDatabase(db); });
}

export async function getJsonSessionUser(token: string) {
  const db = await readDemoDatabase();
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  const user = session && db.users.find((item) => item.id === session.userId);
  return user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role ?? "cliente" as const } : null;
}

export async function deleteJsonSession(token: string) {
  return serialize(async () => { const db = await readDatabase(); db.sessions = db.sessions.filter((item) => item.token !== token); await writeDatabase(db); });
}

async function writeDatabase(database: DemoDatabase): Promise<void> {
  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(tempPath, JSON.stringify(database, null, 2) + "\n", "utf8");
  await rename(tempPath, dataPath);
}

const clone = <T,>(value: T): T => structuredClone(value);
const bogotaToday = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(date);
const dayOfWeek = (date: string) => new Date(date + "T12:00:00-05:00").getDay();
const rangesOverlap = (a: string, b: string, c: string, d: string) => a < d && c < b;
const isBlocking = (booking: DemoReservation) => booking.status === "pagada" || (booking.status === "pendiente_pago" && new Date(booking.paymentExpiresAt).getTime() > Date.now());
const isClosed = (db: DemoDatabase, serviceId: string, date: string) => db.closures.some((closure) => (closure.serviceId === serviceId || closure.serviceId === "*") && closure.from <= date && date <= closure.to);
function limits() {
  const min = bogotaToday();
  const last = new Date(min + "T12:00:00-05:00");
  last.setDate(last.getDate() + 15);
  return { min, max: bogotaToday(last) };
}
export function reservationDateBounds() { return limits(); }
function occupied(db: DemoDatabase, serviceId: string, date: string, start: string, end: string) {
  return db.reservations.filter((booking) => booking.serviceId === serviceId && booking.date === date && isBlocking(booking) && rangesOverlap(booking.startTime, booking.endTime, start, end)).reduce((sum, booking) => sum + booking.quantity, 0);
}
function currentHour() {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "America/Bogota", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
}

export const todayInColombia = () => bogotaToday();
export async function readDemoDatabase() { return serialize(async () => clone(await readDatabase())); }
export async function listDemoCategories() { return (await readDemoDatabase()).categories; }
export async function listDemoServices() { return (await readDemoDatabase()).services; }
export async function listDemoEmployees() { return (await readDemoDatabase()).employees; }
export async function getDemoService(id: string) { return (await readDemoDatabase()).services.find((service) => service.id === id) ?? null; }

export async function getAvailableSlots(serviceId: string, date: string) {
  return serialize(async () => {
    const db = await readDatabase();
    const service = db.services.find((item) => item.id === serviceId && item.isActive);
    if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const { min, max } = limits();
    const day = dayOfWeek(date);
    if (date < min || date > max || day === 1 || !service.operatingDays.includes(day) || isClosed(db, serviceId, date)) return [];
    return Array.from({ length: 9 }, (_, index) => 8 + index).map((hour) => {
      const time = String(hour).padStart(2, "0") + ":00";
      const end = String(hour + 1).padStart(2, "0") + ":00";
      if (date === min && hour <= currentHour()) return { time, remaining: 0 };
      return { time, remaining: Math.max(0, service.capacity - occupied(db, serviceId, date, time, end)) };
    });
  });
}

export async function createDemoReservation(input: {
  serviceId: string; date: string; time: string; quantity: number; people: number;
  name: string; email: string; idNumber: string; acceptedTerms: boolean;
  containsMinor: boolean; responsibleAdult: string;
}) {
  return serialize(async () => {
    if (!input.acceptedTerms) throw new Error("Acepta los términos para continuar.");
    if (input.name.trim().length < 3) throw new Error("Escribe tu nombre completo.");
    if (input.idNumber.trim().length < 5) throw new Error("Revisa el número de documento.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error("Escribe un correo válido.");
    if (input.containsMinor && input.responsibleAdult.trim().length < 3) throw new Error("Indica el nombre del adulto responsable de los menores.");
    const db = await readDatabase();
    const service = db.services.find((item) => item.id === input.serviceId && item.isActive);
    if (!service) throw new Error("Este espacio no está disponible por ahora.");
    const { min, max } = limits();
    if (input.date < min || input.date > max) throw new Error("Elige una fecha entre hoy y los próximos 15 días.");
    const day = dayOfWeek(input.date);
    if (day === 1 || !service.operatingDays.includes(day)) throw new Error("Este espacio está cerrado el día seleccionado.");
    if (isClosed(db, service.id, input.date)) throw new Error("Este espacio tiene un cierre programado para esa fecha.");
    const start = Number(input.time.slice(0, 2));
    if (!/^\d{2}:00$/.test(input.time) || start < 8 || start > 16) throw new Error("El horario debe estar entre las 8:00 a. m. y las 5:00 p. m.");
    if (input.date === min && start <= currentHour()) throw new Error("Ese turno ya empezó. Elige una hora futura.");
    const endTime = String(start + 1).padStart(2, "0") + ":00";
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > service.capacity) throw new Error("La cantidad supera los cupos disponibles.");
    if (!Number.isInteger(input.people) || input.people < 1 || input.people > service.capacityPeople) throw new Error("La cantidad de personas supera el aforo de este espacio.");
    if (service.qrType === "individual" && input.quantity !== input.people) throw new Error("Selecciona un cupo QR por cada persona.");
    const email = input.email.trim().toLowerCase();
    const duplicate = db.reservations.some((booking) => booking.customerEmail.toLowerCase() === email && booking.date === input.date && isBlocking(booking) && rangesOverlap(booking.startTime, booking.endTime, input.time, endTime));
    if (duplicate) throw new Error("Ya tienes una reserva activa en ese horario.");
    const remaining = service.capacity - occupied(db, service.id, input.date, input.time, endTime);
    if (input.quantity > remaining) throw new Error("Quedan " + remaining + " cupos en este turno.");
    const subtotal = service.chargeType === "por_persona" ? service.price * input.people : service.price * input.quantity;
    const now = new Date();
    const booking: DemoReservation = {
      id: randomUUID(), customerName: input.name.trim(), customerEmail: email, customerIdNumber: input.idNumber.trim(),
      serviceId: service.id, serviceName: service.name, date: input.date, startTime: input.time, endTime,
      quantity: input.quantity, people: input.people, status: "pendiente_pago", subtotal, discount: 0, total: subtotal,
      paymentExpiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(), createdAt: now.toISOString(), termsVersion: db.termsVersion,
      containsMinor: input.containsMinor, responsibleAdult: input.containsMinor ? input.responsibleAdult.trim() : null,
    };
    db.reservations.push(booking);
    await writeDatabase(db);
    return clone(booking);
  });
}

export async function getDemoReservation(id: string) {
  return serialize(async () => {
    const db = await readDatabase();
    const booking = db.reservations.find((item) => item.id === id);
    if (!booking) return null;
    if (booking.status === "pendiente_pago" && new Date(booking.paymentExpiresAt).getTime() <= Date.now()) {
      booking.status = "expirada";
      await writeDatabase(db);
    }
    return clone({ ...booking, payment: db.payments.find((payment) => payment.reservationId === id) ?? null, qrs: db.qrs.filter((qr) => qr.reservationId === id) });
  });
}

export async function completeDemoPayment(id: string) {
  return serialize(async () => {
    const db = await readDatabase();
    const booking = db.reservations.find((item) => item.id === id);
    if (!booking) throw new Error("No encontramos esta reserva.");
    if (booking.status === "expirada" || new Date(booking.paymentExpiresAt).getTime() <= Date.now()) {
      booking.status = "expirada";
      await writeDatabase(db);
      throw new Error("El bloqueo venció. Vuelve a elegir tu horario.");
    }
    if (booking.status === "pagada") return;
    booking.status = "pagada";
    const paidAt = new Date().toISOString();
    db.payments.push({ id: randomUUID(), reservationId: id, reference: "DEMO-" + randomUUID().slice(0, 8).toUpperCase(), amount: booking.total, method: "Tarjeta de prueba", status: "aprobado", paidAt });
    const service = db.services.find((item) => item.id === booking.serviceId)!;
    const ticketCount = service.qrType === "individual" ? booking.people : 1;
    for (let index = 0; index < ticketCount; index++) {
      db.qrs.push({ id: randomUUID(), reservationId: id, code: "ELITE-" + randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase(), type: service.qrType, used: false, usedAt: null });
    }
    await writeDatabase(db);
  });
}

export async function listDemoReservations(email?: string) {
  return serialize(async () => {
    const db = await readDatabase();
    const now = Date.now();
    let changed = false;
    for (const booking of db.reservations) {
      if (booking.status === "pendiente_pago" && new Date(booking.paymentExpiresAt).getTime() <= now) {
        booking.status = "expirada";
        changed = true;
      }
    }
    if (changed) await writeDatabase(db);
    return clone(db.reservations.filter((item) => !email || item.customerEmail.toLowerCase() === email.trim().toLowerCase()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
}

export async function scanDemoQr(code: string, employeeEmail: string, minorUnderOneMeter = false) {
  return serialize(async () => {
    const db = await readDatabase();
    const normalized = code.trim().toUpperCase();
    const qr = db.qrs.find((item) => item.code === normalized);
    const booking = qr && db.reservations.find((item) => item.id === qr.reservationId);
    const employee = db.employees.find((item) => item.email.toLowerCase() === employeeEmail.toLowerCase() && item.isActive);
    const assignedServiceId = employee?.serviceId ?? "";
    const service = db.services.find((item) => item.id === assignedServiceId);
    let result: AccessResult = "permitido";
    let message = "Acceso autorizado. Entrega la manilla al visitante.";
    if (!qr || !booking) {
      result = "qr_invalido"; message = "No encontramos un código QR válido.";
    } else if (!employee || !service) {
      result = "servicio_incorrecto"; message = "Tu cuenta no tiene un espacio activo asignado. Contacta al administrador.";
    } else if (booking.serviceId !== assignedServiceId) {
      const actualService = db.services.find((item) => item.id === booking.serviceId);
      result = "servicio_incorrecto"; message = `Este QR corresponde a ${actualService?.name ?? "otro espacio"}. Tu espacio asignado es ${service.name}. El QR no fue consumido.`;
    } else if (booking.status !== "pagada") {
      result = "reserva_no_pagada"; message = "La reserva no tiene un pago aprobado.";
    } else {
      const now = new Date();
      const today = bogotaToday(now);
      const time = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
      if (booking.date !== today || time < booking.startTime || time >= booking.endTime) {
        result = "fuera_de_horario"; message = "Válido el " + booking.date + ", de " + booking.startTime + " a " + booking.endTime + ".";
      } else if (qr.used) {
        result = "qr_usado"; message = "Este código ya fue registrado.";
      } else if (minorUnderOneMeter && (service?.categoryId === "piscinas" || service?.name.toLowerCase().includes("piscina"))) {
        result = "rechazado_menor"; message = "Acceso rechazado. El menor mide menos de 1 metro.";
      } else {
        qr.used = true; qr.usedAt = now.toISOString();
        employee.lastActivity = now.toISOString();
      }
    }
    const maskedCode = normalized.length > 4 ? "••••" + normalized.slice(-4) : normalized;
    db.accessLogs.push({ id: randomUUID(), code: maskedCode, serviceId: assignedServiceId || booking?.serviceId || "", employeeId: employee?.id, result, createdAt: new Date().toISOString() });
    await writeDatabase(db);
    return { result, message };
  });
}

export async function createDemoEmployee(input: { name: string; email: string; serviceId: string }) {
  return serialize(async () => {
    const db = await readDatabase();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Escribe un nombre y un correo válidos.");
    if (!db.services.some((item) => item.id === input.serviceId && item.isActive)) throw new Error("Selecciona un servicio activo.");
    if (db.employees.some((item) => item.isActive && item.email === email)) throw new Error("Ese correo ya está asignado a un empleado.");
    const employee: DemoEmployee = { id: randomUUID(), name, email, serviceId: input.serviceId, isActive: true, lastActivity: null };
    db.employees.push(employee); await writeDatabase(db); return clone(employee);
  });
}

export async function createDemoEmployeeAccount(input: { name: string; email: string; serviceId: string; passwordHash: string }) {
  return serialize(async () => {
    const db = await readDatabase();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Escribe un nombre y un correo válidos.");
    if (db.users.some((item) => item.email === email)) throw new Error("Ya existe una cuenta con ese correo.");
    if (!db.services.some((item) => item.id === input.serviceId && item.isActive)) throw new Error("Selecciona un espacio activo.");
    if (db.employees.some((item) => item.isActive && item.email === email)) throw new Error("Ese correo ya está asignado a un empleado.");
    const user: DemoUser = { id: randomUUID(), email, fullName: name, passwordHash: input.passwordHash, role: "empleado", createdAt: new Date().toISOString() };
    const employee: DemoEmployee = { id: randomUUID(), name, email, serviceId: input.serviceId, isActive: true, lastActivity: null };
    db.users.push(user);
    db.employees.push(employee);
    await writeDatabase(db);
    return clone(employee);
  });
}

export async function assignDemoEmployee(employeeId: string, serviceId: string) {
  return serialize(async () => {
    const db = await readDatabase();
    const employee = db.employees.find((item) => item.id === employeeId);
    if (!employee) throw new Error("No encontramos este empleado.");
    if (!db.services.some((item) => item.id === serviceId && item.isActive)) throw new Error("Selecciona un espacio activo.");
    employee.serviceId = serviceId;
    await writeDatabase(db);
  });
}

export async function getEmployeeAccessStats(employeeId: string) {
  const db = await readDemoDatabase();
  const logs = db.accessLogs.filter((item) => item.employeeId === employeeId);
  const today = bogotaToday();
  const todayLogs = logs.filter((item) => bogotaToday(new Date(item.createdAt)) === today);
  return { total: logs.length, today: todayLogs.length, allowedToday: todayLogs.filter((item) => item.result === "permitido").length, rejectedToday: todayLogs.filter((item) => item.result !== "permitido").length, recent: logs.slice(-5).reverse() };
}
export async function setDemoEmployeeActive(id: string, isActive: boolean) {
  return serialize(async () => { const db = await readDatabase(); const employee = db.employees.find((item) => item.id === id); if (!employee) throw new Error("No encontramos este empleado."); employee.isActive = isActive; await writeDatabase(db); });
}

export async function createDemoCategory(input: { name: string; description: string }) {
  return serialize(async () => {
    const db = await readDatabase();
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) throw new Error("El nombre debe tener entre 2 y 80 caracteres.");
    if (db.categories.some((item) => item.name.toLowerCase() === name.toLowerCase())) throw new Error("Ya existe una categoría con ese nombre.");
    const category: DemoCategory = { id: randomUUID(), name, description: input.description.trim(), isActive: true, createdAt: new Date().toISOString(), artwork: "court" };
    db.categories.push(category); await writeDatabase(db); return clone(category);
  });
}
export async function updateDemoCategory(id: string, input: { name: string; description: string }) {
  return serialize(async () => { const db = await readDatabase(); const item = db.categories.find((category) => category.id === id); if (!item) throw new Error("No encontramos esta categoría."); Object.assign(item, { name: input.name.trim(), description: input.description.trim() }); await writeDatabase(db); return clone(item); });
}
export async function setDemoCategoryActive(id: string, isActive: boolean) {
  return serialize(async () => { const db = await readDatabase(); const item = db.categories.find((category) => category.id === id); if (!item) throw new Error("No encontramos esta categoría."); item.isActive = isActive; await writeDatabase(db); });
}
export async function deleteDemoCategory(id: string) {
  return serialize(async () => { const db = await readDatabase(); if (db.services.some((service) => service.categoryId === id)) throw new Error("Esta categoría tiene espacios asociados. Desactívala para conservar el historial."); db.categories = db.categories.filter((category) => category.id !== id); await writeDatabase(db); });
}

export async function createDemoService(input: DemoServiceInput) {
  return serialize(async () => {
    const db = await readDatabase(); const name = input.name.trim();
    if (!db.categories.some((category) => category.id === input.categoryId && category.isActive)) throw new Error("Selecciona una categoría activa.");
    if (name.length < 3 || name.length > 100) throw new Error("El nombre debe tener entre 3 y 100 caracteres.");
    if (db.services.some((item) => item.name.toLowerCase() === name.toLowerCase())) throw new Error("Ya existe un espacio con ese nombre.");
    const item: DemoService = { ...input, id: randomUUID(), name, description: input.description.trim(), isActive: true, createdAt: new Date().toISOString(), artwork: "court", tag: "Nuevo espacio" };
    db.services.push(item); await writeDatabase(db); return clone(item);
  });
}
export async function updateDemoService(id: string, input: DemoServiceInput) {
  return serialize(async () => { const db = await readDatabase(); const item = db.services.find((service) => service.id === id); if (!item) throw new Error("No encontramos este servicio."); Object.assign(item, input, { name: input.name.trim(), description: input.description.trim() }); await writeDatabase(db); return clone(item); });
}
export async function setDemoServiceActive(id: string, isActive: boolean) {
  return serialize(async () => { const db = await readDatabase(); const item = db.services.find((service) => service.id === id); if (!item) throw new Error("No encontramos este servicio."); item.isActive = isActive; await writeDatabase(db); });
}
export async function deleteDemoService(id: string) {
  return serialize(async () => { const db = await readDatabase(); if (db.reservations.some((booking) => booking.serviceId === id)) throw new Error("Este espacio tiene historial de reservas. Desactívalo para retirarlo del catálogo."); if (db.employees.some((employee) => employee.serviceId === id)) throw new Error("Reasigna los empleados de este espacio antes de eliminarlo."); db.services = db.services.filter((service) => service.id !== id); await writeDatabase(db); });
}
export async function createDemoClosure(input: { serviceId: string; from: string; to: string; reason: string }) {
  return serialize(async () => {
    const db = await readDatabase();
    if (input.serviceId !== "*" && !db.services.some((service) => service.id === input.serviceId)) throw new Error("Selecciona un servicio válido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.from) || !/^\d{4}-\d{2}-\d{2}$/.test(input.to) || input.from > input.to) throw new Error("Revisa el rango de fechas del cierre.");
    const reason = input.reason.trim();
    if (reason.length < 3) throw new Error("Escribe el motivo del cierre.");
    const paidBooking = db.reservations.some((booking) =>
      (input.serviceId === "*" || booking.serviceId === input.serviceId) && booking.status === "pagada" && input.from <= booking.date && booking.date <= input.to,
    );
    if (paidBooking) throw new Error("El rango incluye una reserva pagada. No se puede cerrar un horario confirmado.");
    const closure = { ...input, reason };
    db.closures.push(closure);
    await writeDatabase(db);
    return closure;
  });
}
export async function deleteDemoClosure(index: number) {
  return serialize(async () => { const db = await readDatabase(); if (!Number.isInteger(index) || index < 0 || index >= db.closures.length) throw new Error("No encontramos ese cierre."); db.closures.splice(index, 1); await writeDatabase(db); });
}
