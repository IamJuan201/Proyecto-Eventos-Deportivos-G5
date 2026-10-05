import type { CategoryRepository } from "@/features/categories/services/category.repository";
import type { Category } from "@/features/categories/types/category.types";

const seed: Category[] = [
  { id: "1", name: "Canchas", description: "Canchas deportivas", isActive: true, createdAt: new Date("2026-01-01") },
  { id: "2", name: "Piscinas", description: "Piscinas recreativas y semiolímpicas", isActive: true, createdAt: new Date("2026-01-01") },
  { id: "3", name: "Gimnasio", description: "Zona de máquinas y pesas", isActive: true, createdAt: new Date("2026-01-01") },
  { id: "4", name: "Zona Húmeda", description: "Sauna, turco y jacuzzi", isActive: false, createdAt: new Date("2026-01-01") },
];

// Kept on globalThis so the data survives hot reloads in development.
const store = globalThis as typeof globalThis & { mockCategories?: Category[] };
store.mockCategories ??= seed;

function findOrThrow(id: string): Category {
  const category = store.mockCategories!.find((item) => item.id === id);
  if (!category) {
    throw new Error("La categoría no existe.");
  }
  return category;
}

export const mockCategoryRepository: CategoryRepository = {
  async list() {
    return [...store.mockCategories!];
  },
  async getById(id) {
    return store.mockCategories!.find((item) => item.id === id) ?? null;
  },
  async create(input) {
    const category: Category = { id: crypto.randomUUID(), ...input, isActive: true, createdAt: new Date() };
    store.mockCategories!.push(category);
    return category;
  },
  async update(id, input) {
    return Object.assign(findOrThrow(id), input);
  },
  async setActive(id, isActive) {
    return Object.assign(findOrThrow(id), { isActive });
  },
  async delete(id) {
    findOrThrow(id);
    store.mockCategories = store.mockCategories!.filter((item) => item.id !== id);
  },
};
