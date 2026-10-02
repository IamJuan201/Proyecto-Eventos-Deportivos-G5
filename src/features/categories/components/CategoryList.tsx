import Link from "next/link";
import { toggleCategoryStatus } from "@/features/categories/api/category.actions";
import { DeleteCategoryButton } from "@/features/categories/components/DeleteCategoryButton";
import type { Category } from "@/features/categories/types/category.types";

export function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-gray-500">Aún no hay categorías registradas.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b">
        <tr>
          <th className="py-2">Nombre</th>
          <th className="py-2">Descripción</th>
          <th className="py-2">Estado</th>
          <th className="py-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => (
          <tr key={category.id} className="border-b">
            <td className="py-2 font-medium">{category.name}</td>
            <td className="py-2 text-gray-600">{category.description}</td>
            <td className="py-2">
              <span className={category.isActive ? "text-green-600" : "text-gray-400"}>
                {category.isActive ? "Activa" : "Inactiva"}
              </span>
            </td>
            <td className="flex gap-3 py-2">
              <Link href={`/admin/categories?edit=${category.id}`} className="text-sm hover:underline">
                Editar
              </Link>
              <form action={toggleCategoryStatus.bind(null, category.id, !category.isActive)}>
                <button type="submit" className="text-sm hover:underline">
                  {category.isActive ? "Desactivar" : "Activar"}
                </button>
              </form>
              <DeleteCategoryButton id={category.id} name={category.name} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
