import { supabase } from "../lib/supabase";
import { InventoryState, Lot, Movement, Product, Supplier, Tag } from "../types";
import { todayIso } from "../utils/dates";

export type Organization = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  name: Product["name"];
  type: Product["type"];
  category: string;
  subcategory: string;
  unit: Product["unit"];
  min_stock: number;
  main_location: string;
  main_supplier_id: string | null;
  notes: string;
  active: boolean;
};

type ProductTagRow = {
  product_id: string;
  tag_id: string;
};

type LotRow = {
  id: string;
  product_id: string;
  lot_code: string;
  expires_at: string;
  current_quantity: number;
  entry_date: string;
  supplier_id: string | null;
  notes: string;
  status: Lot["status"];
};

type MovementRow = {
  id: string;
  date: string;
  product_id: string;
  lot_id: string | null;
  type: Movement["type"];
  quantity: number;
  reason: string;
  responsible: string;
  notes: string;
};

const cleanId = (value: string) => value || crypto.randomUUID();
const nullable = (value: string) => value || null;

export const getOrganizations = async () => {
  const { data, error } = await supabase.from("organizations").select("id, name").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Organization[];
};

export const createOrganization = async (name: string) => {
  const { data, error } = await supabase.rpc("create_organization", { org_name: name });
  if (error) throw error;
  return data as Organization;
};

export const getState = async (organizationId: string): Promise<InventoryState> => {
  const [suppliersResult, tagsResult, productsResult, productTagsResult, lotsResult, movementsResult] = await Promise.all([
    supabase.from("suppliers").select("id, name, contact, phone, email, notes").eq("organization_id", organizationId).order("name"),
    supabase.from("tags").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase
      .from("products")
      .select("id, name, type, category, subcategory, unit, min_stock, main_location, main_supplier_id, notes, active")
      .eq("organization_id", organizationId)
      .order("active", { ascending: false })
      .order("name"),
    supabase.from("product_tags").select("product_id, tag_id").eq("organization_id", organizationId),
    supabase
      .from("lots")
      .select("id, product_id, lot_code, expires_at, current_quantity, entry_date, supplier_id, notes, status")
      .eq("organization_id", organizationId)
      .order("expires_at"),
    supabase
      .from("movements")
      .select("id, date, product_id, lot_id, type, quantity, reason, responsible, notes")
      .eq("organization_id", organizationId)
      .order("date", { ascending: false })
      .limit(500)
  ]);

  const error = suppliersResult.error || tagsResult.error || productsResult.error || productTagsResult.error || lotsResult.error || movementsResult.error;
  if (error) throw error;

  const productTags = (productTagsResult.data || []) as ProductTagRow[];
  const products = ((productsResult.data || []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    type: product.type,
    category: product.category,
    subcategory: product.subcategory,
    unit: product.unit,
    minStock: product.min_stock,
    mainLocation: product.main_location,
    mainSupplierId: product.main_supplier_id || "",
    notes: product.notes,
    active: product.active,
    tags: productTags.filter((tag) => tag.product_id === product.id).map((tag) => tag.tag_id)
  }));

  const lots = ((lotsResult.data || []) as LotRow[]).map((lot) => ({
    id: lot.id,
    productId: lot.product_id,
    lotCode: lot.lot_code,
    expiresAt: lot.expires_at,
    currentQuantity: lot.current_quantity,
    entryDate: lot.entry_date,
    supplierId: lot.supplier_id || "",
    notes: lot.notes,
    status: lot.status
  }));

  const movements = ((movementsResult.data || []) as MovementRow[]).map((movement) => ({
    id: movement.id,
    date: movement.date,
    productId: movement.product_id,
    lotId: movement.lot_id || "",
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    responsible: movement.responsible,
    notes: movement.notes
  }));

  return {
    suppliers: (suppliersResult.data || []) as Supplier[],
    tags: (tagsResult.data || []) as Tag[],
    products,
    lots,
    movements
  };
};

export const upsertSupplier = async (organizationId: string, supplier: Supplier) => {
  const { error } = await supabase.from("suppliers").upsert({
    id: cleanId(supplier.id),
    organization_id: organizationId,
    name: supplier.name,
    contact: supplier.contact,
    phone: supplier.phone,
    email: supplier.email,
    notes: supplier.notes
  });
  if (error) throw error;
};

export const upsertTag = async (organizationId: string, tag: Tag) => {
  const { error } = await supabase.from("tags").upsert({
    id: cleanId(tag.id),
    organization_id: organizationId,
    name: tag.name
  });
  if (error) throw error;
};

export const upsertProduct = async (organizationId: string, product: Product) => {
  const productId = cleanId(product.id);
  const { error: productError } = await supabase.from("products").upsert({
    id: productId,
    organization_id: organizationId,
    name: product.name,
    type: product.type,
    category: product.category,
    subcategory: product.subcategory,
    unit: product.unit,
    min_stock: product.minStock,
    main_location: product.mainLocation,
    main_supplier_id: nullable(product.mainSupplierId),
    notes: product.notes,
    active: product.active
  });
  if (productError) throw productError;

  const { error: deleteError } = await supabase.from("product_tags").delete().eq("organization_id", organizationId).eq("product_id", productId);
  if (deleteError) throw deleteError;

  if (!product.tags.length) return;

  const { error: tagsError } = await supabase.from("product_tags").insert(
    product.tags.map((tagId) => ({
      organization_id: organizationId,
      product_id: productId,
      tag_id: tagId
    }))
  );
  if (tagsError) throw tagsError;
};

export const upsertLot = async (organizationId: string, lot: Lot) => {
  const { error } = await supabase.from("lots").upsert({
    id: cleanId(lot.id),
    organization_id: organizationId,
    product_id: lot.productId,
    lot_code: lot.lotCode,
    expires_at: lot.expiresAt,
    current_quantity: lot.currentQuantity,
    entry_date: lot.entryDate,
    supplier_id: nullable(lot.supplierId),
    notes: lot.notes,
    status: lot.status
  });
  if (error) throw error;
};

export const setLotStatus = async (organizationId: string, lotId: string, status: Lot["status"]) => {
  const payload = status === "agotado" ? { status, current_quantity: 0 } : { status };
  const { error } = await supabase
    .from("lots")
    .update(payload)
    .eq("organization_id", organizationId)
    .eq("id", lotId);
  if (error) throw error;
};

export const addMovement = async (
  organizationId: string,
  movement: Partial<Movement> & Pick<Movement, "productId" | "type" | "quantity">
) => {
  const { error } = await supabase.rpc("register_inventory_movement", {
    target_organization_id: organizationId,
    target_product_id: movement.productId,
    target_lot_id: movement.lotId || null,
    movement_type: movement.type,
    movement_quantity: movement.quantity,
    movement_reason: movement.reason || "",
    movement_responsible: movement.responsible || "",
    movement_notes: movement.notes || "",
    movement_date: movement.date || todayIso()
  });
  if (error) throw error;
};

export const importProducts = async (organizationId: string, products: Product[]) => {
  for (const product of products) {
    await upsertProduct(organizationId, product);
  }
};
