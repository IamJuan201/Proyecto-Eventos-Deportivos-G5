import type { CategoryRepository } from "@/features/categories/services/category.repository";
import { prismaCategoryRepository } from "@/features/categories/services/prisma-category.repository";
import type { Category, CategoryInput } from "@/features/categories/types/category.types";

export class CategoryValidationError extends Error {}

export function createCategoryService(repository: CategoryRepository) {
  async function validate(input: CategoryInput, currentId?: string): Promise<CategoryInput> {
    const name = input.name.trim();
    const description = input.description.trim();

    if (name.length < 3 || name.length > 50) {
      throw new CategoryValidationError("El nombre debe tener entre 3 y 50 caracteres.");
    }
    if (description.length > 200) {
      throw new CategoryValidationError("La descripción no puede superar los 200 caracteres.");
    }

    const categories = await repository.list();
    const duplicated = categories.some(
      (category) => category.id !== currentId && category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicated) {
      throw new CategoryValidationError("Ya existe una categoría con ese nombre.");
    }

    return { name, description };
  }

  return {
    list(): Promise<Category[]> {
      return repository.list();
    },
    /** Categories visible to clients in the public catalog. */
    async listActive(): Promise<Category[]> {
      const categories = await repository.list();
      return categories.filter((category) => category.isActive);
    },
    getById(id: string): Promise<Category | null> {
      return repository.getById(id);
    },
    async create(input: CategoryInput): Promise<Category> {
      return repository.create(await validate(input));
    },
    async update(id: string, input: CategoryInput): Promise<Category> {
      return repository.update(id, await validate(input, id));
    },
    setActive(id: string, isActive: boolean): Promise<Category> {
      return repository.setActive(id, isActive);
    },
    delete(id: string): Promise<void> {
      return repository.delete(id);
    },
  };
}

export const categoryService = createCategoryService(prismaCategoryRepository);
