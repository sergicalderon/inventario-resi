import { InventoryState, Lot, Product } from "../types";
import { daysUntil } from "./dates";

export const productStock = (productId: string, lots: Lot[]) =>
  lots.filter((lot) => lot.productId === productId && lot.status === "activo").reduce((total, lot) => total + lot.currentQuantity, 0);

export const supplierName = (state: InventoryState, supplierId: string) =>
  state.suppliers.find((supplier) => supplier.id === supplierId)?.name || "Sin proveedor";

export const productName = (state: InventoryState, productId: string) =>
  state.products.find((product) => product.id === productId)?.name || "Producto eliminado";

export const lotName = (state: InventoryState, lotId: string) => state.lots.find((lot) => lot.id === lotId)?.lotCode || "Sin lote";

export const tagNames = (state: InventoryState, product: Product) =>
  product.tags.map((tagId) => state.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(", ");

export const activeLotsByExpiry = (lots: Lot[]) =>
  [...lots].filter((lot) => lot.status === "activo").sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt));
