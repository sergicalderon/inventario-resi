import { supabase } from "../lib/supabase";
import { Category, InventoryLocation, InventoryState, Lot, Movement, Product, ProductType, ProductTypeCatalog, Subcategory, Supplier, Tag } from "../types";
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
  product_type_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  unit: Product["unit"];
  min_stock: number;
  main_location: string;
  main_location_id: string | null;
  main_supplier_id: string | null;
  notes: string;
  active: boolean;
};

type CatalogRow = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

type CategoryRow = CatalogRow & {
  product_type_id: string | null;
};

type SubcategoryRow = CatalogRow & {
  category_id: string | null;
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
const cleanName = (value: string) => value.trim();
const normalize = (value: string) => cleanName(value).toLocaleLowerCase("es");

const legacyProductTypes: ProductType[] = ["fármaco", "apósito", "fungible", "higiene", "nutrición", "otro"];

const toLegacyProductType = (name: string): ProductType => {
  const normalized = normalize(name);
  return legacyProductTypes.includes(normalized as ProductType) ? (normalized as ProductType) : "otro";
};

const matchesName = <T extends { name: string }>(rows: T[], name: string) => rows.find((row) => normalize(row.name) === normalize(name));

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
  const [
    suppliersResult,
    tagsResult,
    locationsResult,
    productTypesResult,
    categoriesResult,
    subcategoriesResult,
    productsResult,
    productTagsResult,
    lotsResult,
    movementsResult
  ] = await Promise.all([
    supabase.from("suppliers").select("id, name, contact, phone, email, notes").eq("organization_id", organizationId).order("name"),
    supabase.from("tags").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("locations").select("id, name, description, active").eq("organization_id", organizationId).order("active", { ascending: false }).order("name"),
    supabase.from("product_types").select("id, name, description, active").eq("organization_id", organizationId).order("active", { ascending: false }).order("name"),
    supabase.from("categories").select("id, name, description, active, product_type_id").eq("organization_id", organizationId).order("active", { ascending: false }).order("name"),
    supabase.from("subcategories").select("id, name, description, active, category_id").eq("organization_id", organizationId).order("active", { ascending: false }).order("name"),
    supabase
      .from("products")
      .select("id, name, type, category, subcategory, product_type_id, category_id, subcategory_id, unit, min_stock, main_location, main_location_id, main_supplier_id, notes, active")
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

  const error =
    suppliersResult.error ||
    tagsResult.error ||
    locationsResult.error ||
    productTypesResult.error ||
    categoriesResult.error ||
    subcategoriesResult.error ||
    productsResult.error ||
    productTagsResult.error ||
    lotsResult.error ||
    movementsResult.error;
  if (error) throw error;

  const productTags = (productTagsResult.data || []) as ProductTagRow[];
  const products = ((productsResult.data || []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    type: product.type,
    category: product.category,
    subcategory: product.subcategory,
    productTypeId: product.product_type_id || "",
    categoryId: product.category_id || "",
    subcategoryId: product.subcategory_id || "",
    unit: product.unit,
    minStock: product.min_stock,
    mainLocation: product.main_location,
    mainLocationId: product.main_location_id || "",
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
    locations: ((locationsResult.data || []) as CatalogRow[]).map((location) => ({ ...location })),
    productTypes: ((productTypesResult.data || []) as CatalogRow[]).map((productType) => ({ ...productType })),
    categories: ((categoriesResult.data || []) as CategoryRow[]).map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      active: category.active,
      productTypeId: category.product_type_id || ""
    })),
    subcategories: ((subcategoriesResult.data || []) as SubcategoryRow[]).map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      description: subcategory.description,
      active: subcategory.active,
      categoryId: subcategory.category_id || ""
    })),
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

export const upsertLocation = async (organizationId: string, location: InventoryLocation) => {
  const { error } = await supabase.from("locations").upsert({
    id: cleanId(location.id),
    organization_id: organizationId,
    name: cleanName(location.name),
    description: location.description,
    active: location.active
  });
  if (error) throw error;
};

export const upsertProductType = async (organizationId: string, productType: ProductTypeCatalog) => {
  const { error } = await supabase.from("product_types").upsert({
    id: cleanId(productType.id),
    organization_id: organizationId,
    name: cleanName(productType.name),
    description: productType.description,
    active: productType.active
  });
  if (error) throw error;
};

export const upsertCategory = async (organizationId: string, category: Category) => {
  const { error } = await supabase.from("categories").upsert({
    id: cleanId(category.id),
    organization_id: organizationId,
    product_type_id: nullable(category.productTypeId),
    name: cleanName(category.name),
    description: category.description,
    active: category.active
  });
  if (error) throw error;
};

export const upsertSubcategory = async (organizationId: string, subcategory: Subcategory) => {
  const { error } = await supabase.from("subcategories").upsert({
    id: cleanId(subcategory.id),
    organization_id: organizationId,
    category_id: nullable(subcategory.categoryId),
    name: cleanName(subcategory.name),
    description: subcategory.description,
    active: subcategory.active
  });
  if (error) throw error;
};

const ensureLocationId = async (organizationId: string, locationId: string, locationName: string) => {
  if (locationId || !cleanName(locationName)) return locationId;
  const { data, error } = await supabase.from("locations").select("id, name").eq("organization_id", organizationId).ilike("name", cleanName(locationName));
  if (error) throw error;
  const existing = matchesName((data || []) as Pick<InventoryLocation, "id" | "name">[], locationName);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await upsertLocation(organizationId, { id, name: cleanName(locationName), description: "", active: true });
  return id;
};

const ensureProductTypeId = async (organizationId: string, productTypeId: string, typeName: string) => {
  if (productTypeId) return productTypeId;
  const name = cleanName(typeName) || "Otro";
  const { data, error } = await supabase.from("product_types").select("id, name").eq("organization_id", organizationId).ilike("name", name);
  if (error) throw error;
  const existing = matchesName((data || []) as Pick<ProductTypeCatalog, "id" | "name">[], name);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await upsertProductType(organizationId, { id, name, description: "", active: true });
  return id;
};

const ensureCategoryId = async (organizationId: string, categoryId: string, categoryName: string, productTypeId: string) => {
  if (categoryId || !cleanName(categoryName)) return categoryId;
  const query = supabase.from("categories").select("id, name").eq("organization_id", organizationId).ilike("name", cleanName(categoryName));
  const { data, error } = productTypeId ? await query.eq("product_type_id", productTypeId) : await query.is("product_type_id", null);
  if (error) throw error;
  const existing = matchesName((data || []) as Pick<Category, "id" | "name">[], categoryName);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await upsertCategory(organizationId, { id, name: cleanName(categoryName), description: "", active: true, productTypeId });
  return id;
};

const ensureSubcategoryId = async (organizationId: string, subcategoryId: string, subcategoryName: string, categoryId: string) => {
  if (subcategoryId || !cleanName(subcategoryName) || !categoryId) return subcategoryId;
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("category_id", categoryId)
    .ilike("name", cleanName(subcategoryName));
  if (error) throw error;
  const existing = matchesName((data || []) as Pick<Subcategory, "id" | "name">[], subcategoryName);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await upsertSubcategory(organizationId, { id, name: cleanName(subcategoryName), description: "", active: true, categoryId });
  return id;
};

export const upsertProduct = async (organizationId: string, product: Product) => {
  const productId = cleanId(product.id);
  const productTypeId = await ensureProductTypeId(organizationId, product.productTypeId, product.type);
  const categoryId = await ensureCategoryId(organizationId, product.categoryId, product.category, productTypeId);
  const subcategoryId = await ensureSubcategoryId(organizationId, product.subcategoryId, product.subcategory, categoryId);
  const mainLocationId = await ensureLocationId(organizationId, product.mainLocationId, product.mainLocation);
  const { error: productError } = await supabase.from("products").upsert({
    id: productId,
    organization_id: organizationId,
    name: product.name,
    type: toLegacyProductType(product.type),
    category: product.category,
    subcategory: product.subcategory,
    product_type_id: nullable(productTypeId),
    category_id: nullable(categoryId),
    subcategory_id: nullable(subcategoryId),
    unit: product.unit,
    min_stock: product.minStock,
    main_location: product.mainLocation,
    main_location_id: nullable(mainLocationId),
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
