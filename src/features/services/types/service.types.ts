/** 0 = Sunday ... 6 = Saturday, same as Date.getDay(). */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const weekDays: { value: WeekDay; label: string }[] = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export const chargeTypes = [
  { value: "por_hora", label: "Por espacio / hora" },
  { value: "por_persona", label: "Por persona" },
] as const;
export type ChargeType = (typeof chargeTypes)[number]["value"];

export const qrTypes = [
  { value: "grupal", label: "Un QR por reserva" },
  { value: "individual", label: "Un QR por persona" },
] as const;
export type QrType = (typeof qrTypes)[number]["value"];

/** Each service is an individual bookable instance (e.g. "Cancha 1") with its own calendar. */
export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  durationMinutes: number;
  /** Spaces per slot when charged per hour, or spots per slot when charged per person. */
  capacity: number;
  /** Maximum people allowed in a single booking. */
  capacityPeople: number;
  chargeType: ChargeType;
  qrType: QrType;
  operatingDays: WeekDay[];
  isActive: boolean;
  createdAt: Date;
}

export type ServiceInput = Omit<Service, "id" | "isActive" | "createdAt">;
