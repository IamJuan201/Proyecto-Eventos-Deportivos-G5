import type { Category, CategoryInput } from "@/features/categories/types/category.types";

/** Persistence boundary: swap the mock for the real implementation once HU-05 defines the table. */
export interface CategoryRepository {
  list(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<Category>;
  setActive(id: string, isActive: boolean): Promise<Category>;
  delete(id: string): Promise<void>;
}
