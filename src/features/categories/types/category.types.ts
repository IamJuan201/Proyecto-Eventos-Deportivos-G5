export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CategoryInput {
  name: string;
  description: string;
}
