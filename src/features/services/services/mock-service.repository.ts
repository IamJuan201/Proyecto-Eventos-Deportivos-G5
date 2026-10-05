import type { ServiceRepository } from "@/features/services/services/service.repository";
import type { Service } from "@/features/services/types/service.types";

const seed: Service[] = [
  {
    id: "1",
    categoryId: "1",
    name: "Cancha 1",
    description: "Cancha de fútbol 5 en grama sintética",
    imageUrl: "",
    price: 80000,
    durationMinutes: 60,
    capacity: 1,
    operatingDays: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "2",
    categoryId: "1",
    name: "Cancha 2",
    description: "Cancha de fútbol 5 en grama sintética",
    imageUrl: "",
    price: 80000,
    durationMinutes: 60,
    capacity: 1,
    operatingDays: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "3",
    categoryId: "2",
    name: "Piscina semiolímpica",
    description: "Nado libre por turnos",
    imageUrl: "",
    price: 15000,
    durationMinutes: 90,
    capacity: 30,
    operatingDays: [1, 2, 3, 4, 5],
    isActive: true,
    createdAt: new Date("2026-01-01"),
  },
];

// Kept on globalThis so the data survives hot reloads in development.
const store = globalThis as typeof globalThis & { mockServices?: Service[] };
store.mockServices ??= seed;

function findOrThrow(id: string): Service {
  const service = store.mockServices!.find((item) => item.id === id);
  if (!service) {
    throw new Error("El servicio no existe.");
  }
  return service;
}

export const mockServiceRepository: ServiceRepository = {
  async list() {
    return [...store.mockServices!];
  },
  async getById(id) {
    return store.mockServices!.find((item) => item.id === id) ?? null;
  },
  async create(input) {
    const service: Service = { id: crypto.randomUUID(), ...input, isActive: true, createdAt: new Date() };
    store.mockServices!.push(service);
    return service;
  },
  async update(id, input) {
    return Object.assign(findOrThrow(id), input);
  },
  async setActive(id, isActive) {
    return Object.assign(findOrThrow(id), { isActive });
  },
  async delete(id) {
    findOrThrow(id);
    store.mockServices = store.mockServices!.filter((item) => item.id !== id);
  },
};
