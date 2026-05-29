export type ProductType = "fármaco" | "apósito" | "fungible" | "higiene" | "nutrición" | "otro";
export type UnitType = "unidad" | "caja" | "blíster" | "ampolla" | "sobre" | "ml" | "otro";
export type LotStatus = "activo" | "agotado" | "caducado";
export type MovementType = "entrada" | "salida" | "ajuste" | "devolución" | "caducado" | "traslado";

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  notes: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  type: ProductType;
  category: string;
  subcategory: string;
  unit: UnitType;
  minStock: number;
  mainLocation: string;
  mainSupplierId: string;
  tags: string[];
  notes: string;
  active: boolean;
};

export type Lot = {
  id: string;
  productId: string;
  lotCode: string;
  expiresAt: string;
  currentQuantity: number;
  entryDate: string;
  supplierId: string;
  notes: string;
  status: LotStatus;
};

export type Movement = {
  id: string;
  date: string;
  productId: string;
  lotId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  responsible: string;
  notes: string;
};

export type InventoryState = {
  products: Product[];
  lots: Lot[];
  movements: Movement[];
  suppliers: Supplier[];
  tags: Tag[];
};

export type ProductForm = Omit<Product, "id">;
export type LotForm = Omit<Lot, "id" | "status">;
export type MovementForm = Omit<Movement, "id" | "date">;
