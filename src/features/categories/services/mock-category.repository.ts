import type { CategoryRepository } from "@/features/categories/services/category.repository";
import type { Category } from "@/features/categories/types/category.types";
import {
  createDemoCategory,
  deleteDemoCategory,
  listDemoCategories,
  setDemoCategoryActive,
  updateDemoCategory,
} from "@/shared/lib/demo-store";

const toCategory = (item: Awaited<ReturnType<typeof listDemoCategories>>[number]): Category => ({
  id: item.id,
  name: item.name,
  description: item.description,
  isActive: item.isActive,
  createdAt: new Date(item.createdAt),
});

export const mockCategoryRepository: CategoryRepository = {
  async list() {
    return (await listDemoCategories()).map(toCategory);
  },
  async getById(id) {
    return (await listDemoCategories()).map(toCategory).find((category) => category.id === id) ?? null;
  },
  async create(input) {
    return toCategory(await createDemoCategory(input));
  },
  async update(id, input) {
    return toCategory(await updateDemoCategory(id, input));
  },
  async setActive(id, isActive) {
    await setDemoCategoryActive(id, isActive);
    const category = (await listDemoCategories()).find((item) => item.id === id);
    if (!category) throw new Error("La categoría no existe.");
    return toCategory(category);
  },
  async delete(id) {
    await deleteDemoCategory(id);
  },
};
