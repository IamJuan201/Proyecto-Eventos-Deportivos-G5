"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serviceService } from "@/features/services/services/service.service";
import type { ChargeType, QrType, ServiceIcon, ServiceInput, WeekDay } from "@/features/services/types/service.types";
import { requireRole } from "@/features/auth/lib/session";
import { createSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { randomUUID } from "node:crypto";

const SERVICES_PATH = "/admin/services";
const SERVICE_IMAGE_BUCKET = "service-images";
const MAX_SERVICE_IMAGE_BYTES = 3_500_000;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type ServiceFormState = { error?: string; success?: boolean };

export async function saveService(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const imageFile = formData.get("coverImage");
  const input: ServiceInput = {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    price: Number(formData.get("price")),
    capacity: Number(formData.get("capacity")),
    capacityPeople: Number(formData.get("capacityPeople")),
    chargeType: String(formData.get("chargeType") ?? "") as ChargeType,
    qrType: String(formData.get("qrType") ?? "") as QrType,
    operatingDays: formData.getAll("operatingDays").map((day) => Number(day) as WeekDay),
    icon: String(formData.get("icon") ?? "court") as ServiceIcon,
    tag: String(formData.get("tag") ?? ""),
  };

  let uploadedPath: string | undefined;
  let previousImageUrl = "";
  try {
    if (id) {
      const currentService = await serviceService.getById(id);
      if (!currentService) return { error: "No se encontró el espacio que intentas editar." };
      previousImageUrl = currentService.imageUrl;
    }

    if (imageFile instanceof File && imageFile.size > 0) {
      const extension = IMAGE_EXTENSIONS[imageFile.type];
      if (!extension) return { error: "Usa una imagen JPG, PNG, WebP o AVIF." };
      if (imageFile.size > MAX_SERVICE_IMAGE_BYTES) return { error: "La imagen debe pesar máximo 3.5 MB." };

      const supabase = createSupabaseAdminClient();
      uploadedPath = `services/${id || "new"}/cover-${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .upload(uploadedPath, imageFile, { contentType: imageFile.type, cacheControl: "31536000", upsert: false });
      if (uploadError) throw new Error("No se pudo subir la imagen. Verifica la configuración del bucket de Storage.");
      input.imageUrl = supabase.storage.from(SERVICE_IMAGE_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
    }

    if (id) {
      await serviceService.update(id, input);
    } else {
      await serviceService.create(input);
    }

    if (uploadedPath && previousImageUrl) await removeServiceImage(previousImageUrl);
  } catch (error) {
    if (uploadedPath) {
      await createSupabaseAdminClient().storage.from(SERVICE_IMAGE_BUCKET).remove([uploadedPath]).catch(() => undefined);
    }
    return { error: error instanceof Error ? error.message : "No se pudo guardar el servicio." };
  }

  revalidatePath(SERVICES_PATH);
  if (id) {
    redirect(SERVICES_PATH);
  }
  return { success: true };
}

export async function toggleServiceStatus(id: string, isActive: boolean) {
  await requireRole("admin");
  try {
    await serviceService.setActive(id, isActive);
  } catch (error) {
    redirectWithError(error, "No se pudo cambiar el estado del servicio.");
  }
  revalidatePath(SERVICES_PATH);
}

export async function deleteService(id: string) {
  await requireRole("admin");
  try {
    const service = await serviceService.getById(id);
    await serviceService.delete(id);
    if (service?.imageUrl) await removeServiceImage(service.imageUrl);
  } catch (error) {
    redirectWithError(error, "No se pudo eliminar el servicio.");
  }
  revalidatePath(SERVICES_PATH);
}

async function removeServiceImage(publicUrl: string) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) return;

    const publicPrefix = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${SERVICE_IMAGE_BUCKET}/`;
    if (!publicUrl.startsWith(publicPrefix)) return;

    const objectPath = decodeURIComponent(publicUrl.slice(publicPrefix.length));
    if (!objectPath) return;

    const { error } = await createSupabaseAdminClient().storage.from(SERVICE_IMAGE_BUCKET).remove([objectPath]);
    if (error) console.error("Could not remove service image from Supabase Storage:", error.message);
  } catch (error) {
    console.error("Could not remove service image from Supabase Storage:", error);
  }
}

function redirectWithError(error: unknown, fallback: string): never {
  redirect(SERVICES_PATH + "?error=" + encodeURIComponent(error instanceof Error ? error.message : fallback));
}
