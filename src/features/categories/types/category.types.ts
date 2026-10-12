export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CategoryInput {
  name: string;
  description: string;
}
