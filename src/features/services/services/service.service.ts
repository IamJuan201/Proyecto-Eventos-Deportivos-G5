import { categoryService } from "@/features/categories/services/category.service";
import type { ServiceRepository } from "@/features/services/services/service.repository";
import { prismaServiceRepository } from "@/features/services/services/prisma-service.repository";
import { chargeTypes, qrTypes, serviceIcons, weekDays, type Service, type ServiceInput } from "@/features/services/types/service.types";

export class ServiceValidationError extends Error {}

export function createServiceService(repository: ServiceRepository) {
  async function validate(input: ServiceInput, currentId?: string): Promise<ServiceInput> {
    const data = {
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      imageUrl: input.imageUrl.trim(),
      tag: input.tag.trim(),
    };

    if (data.name.length < 3 || data.name.length > 80) {
      throw new ServiceValidationError("El nombre debe tener entre 3 y 80 caracteres.");
    }
    if (data.description.length > 500) {
      throw new ServiceValidationError("La descripción no puede superar los 500 caracteres.");
    }
    if (data.imageUrl && !URL.canParse(data.imageUrl)) {
      throw new ServiceValidationError("La imagen debe ser una URL válida.");
    }
    if (!(await categoryService.getById(data.categoryId))) {
      throw new ServiceValidationError("Selecciona una categoría válida.");
    }
    if (!Number.isFinite(data.price) || data.price < 0) {
      throw new ServiceValidationError("El precio debe ser mayor o igual a 0.");
    }
    if (!Number.isInteger(data.capacity) || data.capacity < 1) {
      throw new ServiceValidationError("La capacidad debe ser un número entero mayor o igual a 1.");
    }
    if (!Number.isInteger(data.capacityPeople) || data.capacityPeople < 1) {
      throw new ServiceValidationError("Las personas por reserva deben ser un número entero mayor o igual a 1.");
    }
    if (!chargeTypes.some((type) => type.value === data.chargeType)) {
      throw new ServiceValidationError("Selecciona un tipo de cobro válido.");
    }
    if (!qrTypes.some((type) => type.value === data.qrType)) {
      throw new ServiceValidationError("Selecciona un tipo de QR válido.");
    }
    if (!serviceIcons.some((icon) => icon.value === data.icon)) {
      throw new ServiceValidationError("Selecciona una ilustración válida.");
    }
    if (data.tag.length > 60) {
      throw new ServiceValidationError("La etiqueta no puede superar los 60 caracteres.");
    }
    if (data.operatingDays.length === 0) {
      throw new ServiceValidationError("Selecciona al menos un día de operación.");
    }

    const services = await repository.list();
    const duplicated = services.some(
      (service) => service.id !== currentId && service.name.toLowerCase() === data.name.toLowerCase(),
    );
    if (duplicated) {
      throw new ServiceValidationError("Ya existe un servicio con ese nombre.");
    }

    return data;
  }

  return {
    list(): Promise<Service[]> {
      return repository.list();
    },
    getById(id: string): Promise<Service | null> {
      return repository.getById(id);
    },
    async create(input: ServiceInput): Promise<Service> {
      return repository.create(await validate(input));
    },
    async update(id: string, input: ServiceInput): Promise<Service> {
      const data = await validate(input, id);
      const current = await repository.getById(id);
      const removedDays = (current?.operatingDays ?? []).filter((day) => !data.operatingDays.includes(day));
      if (removedDays.length) {
        const bookedDays = await repository.bookedWeekDays(id);
        const blocked = weekDays.filter((day) => removedDays.includes(day.value) && bookedDays.includes(day.value));
        if (blocked.length) {
          const names = blocked.map((day) => "el " + day.label.toLowerCase());
          const list = names.length > 1 ? names.slice(0, -1).join(", ") + " y " + names.at(-1) : names[0];
          const plural = names.length > 1;
          throw new ServiceValidationError(
            "No puedes quitar " + list + ": hay reservas activas " + (plural ? "esos días" : "ese día") + " desde hoy en adelante. Podrás " + (plural ? "quitarlos" : "quitarlo") + " cuando esas reservas pasen.",
          );
        }
      }
      return repository.update(id, data);
    },
    setActive(id: string, isActive: boolean): Promise<Service> {
      return repository.setActive(id, isActive);
    },
    delete(id: string): Promise<void> {
      return repository.delete(id);
    },
  };
}

export const serviceService = createServiceService(prismaServiceRepository);
