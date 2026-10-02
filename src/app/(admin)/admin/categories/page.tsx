import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { CategoryList } from "@/features/categories/components/CategoryList";
import { categoryService } from "@/features/categories/services/category.service";

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const { edit } = await searchParams;
  const categories = await categoryService.list();
  const editing = typeof edit === "string" ? await categoryService.getById(edit) : null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Categorías de servicios</h1>
      <CategoryForm key={editing?.id ?? "new"} category={editing ?? undefined} />
      <CategoryList categories={categories} />
    </main>
  );
}
