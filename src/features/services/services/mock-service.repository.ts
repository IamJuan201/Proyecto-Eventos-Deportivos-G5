import type { ServiceRepository } from "@/features/services/services/service.repository";
import type { Service } from "@/features/services/types/service.types";
import {
  createDemoService,
  deleteDemoService,
  listDemoServices,
  setDemoServiceActive,
  updateDemoService,
} from "@/shared/lib/demo-store";

const toService = (item: Awaited<ReturnType<typeof listDemoServices>>[number]): Service => ({
  id: item.id,
  categoryId: item.categoryId,
  name: item.name,
  description: item.description,
  imageUrl: item.imageUrl,
  price: item.price,
  durationMinutes: item.durationMinutes,
  capacity: item.capacity,
  operatingDays: item.operatingDays as Service["operatingDays"],
  isActive: item.isActive,
  createdAt: new Date(item.createdAt),
});

export const mockServiceRepository: ServiceRepository = {
  async list() {
    return (await listDemoServices()).map(toService);
  },
  async getById(id) {
    return (await listDemoServices()).map(toService).find((service) => service.id === id) ?? null;
  },
  async create(input) {
    return toService(await createDemoService(input));
  },
  async update(id, input) {
    return toService(await updateDemoService(id, input));
  },
  async setActive(id, isActive) {
    await setDemoServiceActive(id, isActive);
    const service = (await listDemoServices()).find((item) => item.id === id);
    if (!service) throw new Error("El espacio no existe.");
    return toService(service);
  },
  async delete(id) {
    await deleteDemoService(id);
  },
};
