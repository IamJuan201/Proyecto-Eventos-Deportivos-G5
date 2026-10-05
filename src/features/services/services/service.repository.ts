import type { Service, ServiceInput } from "@/features/services/types/service.types";

/** Persistence boundary: swap the mock for the real implementation once HU-05 defines the table. */
export interface ServiceRepository {
  list(): Promise<Service[]>;
  getById(id: string): Promise<Service | null>;
  create(input: ServiceInput): Promise<Service>;
  update(id: string, input: ServiceInput): Promise<Service>;
  setActive(id: string, isActive: boolean): Promise<Service>;
  delete(id: string): Promise<void>;
}
