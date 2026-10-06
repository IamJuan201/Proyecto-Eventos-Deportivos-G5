import "server-only";
import type { Categoria } from "@/generated/prisma/client";
import type { CategoryRepository } from "@/features/categories/services/category.repository";
import type { Category } from "@/features/categories/types/category.types";
import { getPrisma, isPrismaError, isUuid } from "@/shared/lib/prisma";

const toCategory = (row: Categoria): Category => ({
  id: row.id,
  name: row.nombre,
  description: row.descripcion ?? "",
  isActive: row.activa,
});

export const prismaCategoryRepository: CategoryRepository = {
  async list() {
    const rows = await getPrisma().categoria.findMany({ orderBy: { nombre: "asc" } });
    return rows.map(toCategory);
  },
  async getById(id) {
    if (!isUuid(id)) return null;
    const row = await getPrisma().categoria.findUnique({ where: { id } });
    return row && toCategory(row);
  },
  async create(input) {
    return toCategory(await getPrisma().categoria.create({ data: { nombre: input.name, descripcion: input.description } }));
  },
  async update(id, input) {
    return toCategory(await getPrisma().categoria.update({ where: { id }, data: { nombre: input.name, descripcion: input.description } }));
  },
  async setActive(id, isActive) {
    return toCategory(await getPrisma().categoria.update({ where: { id }, data: { activa: isActive } }));
  },
  async delete(id) {
    try {
      await getPrisma().categoria.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, "P2003")) {
        throw new Error("Esta categoría tiene espacios asociados. Desactívala para conservar el historial.");
      }
      throw error;
    }
  },
};
