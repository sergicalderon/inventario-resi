import { Plus, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { InventoryState, Product, ProductType, UnitType } from "../types";
import { productStock, supplierName, tagNames } from "../utils/inventory";

const unitTypes: UnitType[] = ["unidad", "caja", "blíster", "ampolla", "sobre", "ml", "otro"];
const legacyProductTypes: ProductType[] = ["fármaco", "apósito", "fungible", "higiene", "nutrición", "otro"];

const normalize = (value: string) => value.trim().toLocaleLowerCase("es");
const toLegacyProductType = (name: string): ProductType => {
  const normalized = normalize(name);
  return legacyProductTypes.includes(normalized as ProductType) ? (normalized as ProductType) : "otro";
};

const catalogName = <T extends { id: string; name: string }>(items: T[], id: string, fallback = "") => items.find((item) => item.id === id)?.name || fallback;

export const Products = ({ state, onSave }: { state: InventoryState; onSave: (product: Product) => void }) => {
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ type: "", category: "", supplier: "", location: "", tag: "" });

  const filtered = useMemo(
    () =>
      state.products.filter((product) => {
        const typeName = catalogName(state.productTypes, product.productTypeId, product.type);
        const categoryName = catalogName(state.categories, product.categoryId, product.category);
        const subcategoryName = catalogName(state.subcategories, product.subcategoryId, product.subcategory);
        const locationName = catalogName(state.locations, product.mainLocationId, product.mainLocation);
        const filterTypeName = catalogName(state.productTypes, filters.type);
        const filterCategoryName = catalogName(state.categories, filters.category);
        const filterLocationName = catalogName(state.locations, filters.location);
        const text = `${product.name} ${typeName} ${categoryName} ${subcategoryName} ${locationName} ${product.notes}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (!filters.type || product.productTypeId === filters.type || (!product.productTypeId && normalize(product.type) === normalize(filterTypeName))) &&
          (!filters.category || product.categoryId === filters.category || (!product.categoryId && normalize(product.category) === normalize(filterCategoryName))) &&
          (!filters.supplier || product.mainSupplierId === filters.supplier) &&
          (!filters.location || product.mainLocationId === filters.location || (!product.mainLocationId && normalize(product.mainLocation) === normalize(filterLocationName))) &&
          (!filters.tag || product.tags.includes(filters.tag))
        );
      }),
    [state.products, query, filters]
  );

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Productos</h1>
          <p>Catálogo activo e histórico de material sanitario.</p>
        </div>
        <button className="primary" onClick={() => setEditing(blankProduct())}>
          <Plus size={18} /> Crear producto
        </button>
      </div>
      <div className="filters">
        <label className="search">
          <Search size={16} />
          <input placeholder="Buscar producto, categoría u observación" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="">Tipo</option>
          {state.productTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}
        </select>
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Categoría</option>
          {state.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        <select value={filters.supplier} onChange={(event) => setFilters({ ...filters, supplier: event.target.value })}>
          <option value="">Proveedor</option>
          {state.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}
        </select>
        <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
          <option value="">Ubicación</option>
          {state.locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}
        </select>
        <select value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })}>
          <option value="">Etiqueta</option>
          {state.tags.map((tag) => <option value={tag.id} key={tag.id}>{tag.name}</option>)}
        </select>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Ubicación</th>
                <th>Proveedor</th>
                <th>Etiquetas</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const stock = productStock(product.id, state.lots);
                return (
                  <tr key={product.id} className={!product.active ? "inactive-row" : ""}>
                    <td><strong>{product.name}</strong><span>{catalogName(state.subcategories, product.subcategoryId, product.subcategory)}</span></td>
                    <td>{catalogName(state.productTypes, product.productTypeId, product.type)}</td>
                    <td>{catalogName(state.categories, product.categoryId, product.category)}</td>
                    <td><span className={`pill ${stock <= product.minStock ? "danger" : ""}`}>{stock}</span></td>
                    <td>{product.minStock}</td>
                    <td>{catalogName(state.locations, product.mainLocationId, product.mainLocation) || "Sin ubicación"}</td>
                    <td>{product.mainSupplierId ? supplierName(state, product.mainSupplierId) : "Sin proveedor"}</td>
                    <td className="tags-cell">{tagNames(state, product) || "Sin etiquetas"}</td>
                    <td><span className="pill">{product.active ? "activo" : "inactivo"}</span></td>
                    <td><button className="secondary" onClick={() => setEditing(product)}>Editar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <ProductModal
          product={editing}
          state={state}
          onClose={() => setEditing(null)}
          onSave={(product) => {
            onSave(product);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const blankProduct = (): Product => ({
  id: crypto.randomUUID(),
  name: "",
  type: "fármaco",
  category: "",
  subcategory: "",
  productTypeId: "",
  categoryId: "",
  subcategoryId: "",
  unit: "unidad",
  minStock: 0,
  mainLocation: "",
  mainLocationId: "",
  mainSupplierId: "",
  tags: [],
  notes: "",
  active: true
});

const ProductModal = ({ product, state, onClose, onSave }: { product: Product; state: InventoryState; onClose: () => void; onSave: (product: Product) => void }) => {
  const [form, setForm] = useState(product);
  const toggleTag = (tagId: string) => setForm({ ...form, tags: form.tags.includes(tagId) ? form.tags.filter((id) => id !== tagId) : [...form.tags, tagId] });
  const selectableProductTypes = state.productTypes.filter((type) => type.active || type.id === form.productTypeId);
  const selectableCategories = state.categories.filter((category) => (!form.productTypeId || category.productTypeId === form.productTypeId) && (category.active || category.id === form.categoryId));
  const selectableSubcategories = state.subcategories.filter((subcategory) => subcategory.categoryId === form.categoryId && (subcategory.active || subcategory.id === form.subcategoryId));
  const selectableLocations = state.locations.filter((location) => location.active || location.id === form.mainLocationId);

  const updateProductType = (productTypeId: string) => {
    const productType = state.productTypes.find((item) => item.id === productTypeId);
    setForm({
      ...form,
      productTypeId,
      type: toLegacyProductType(productType?.name || ""),
      categoryId: "",
      category: "",
      subcategoryId: "",
      subcategory: ""
    });
  };

  const updateCategory = (categoryId: string) => {
    const category = state.categories.find((item) => item.id === categoryId);
    setForm({ ...form, categoryId, category: category?.name || "", subcategoryId: "", subcategory: "" });
  };

  const updateSubcategory = (subcategoryId: string) => {
    const subcategory = state.subcategories.find((item) => item.id === subcategoryId);
    setForm({ ...form, subcategoryId, subcategory: subcategory?.name || "" });
  };

  const updateLocation = (mainLocationId: string) => {
    const location = state.locations.find((item) => item.id === mainLocationId);
    setForm({ ...form, mainLocationId, mainLocation: location?.name || "" });
  };

  return (
    <Modal title="Producto" onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Tipo<select required value={form.productTypeId} onChange={(event) => updateProductType(event.target.value)}><option value="">Seleccionar tipo</option>{selectableProductTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select></label>
        <label>Categoría<select value={form.categoryId} onChange={(event) => updateCategory(event.target.value)}><option value="">Sin categoría</option>{selectableCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label>Subcategoría<select value={form.subcategoryId} onChange={(event) => updateSubcategory(event.target.value)} disabled={!form.categoryId}><option value="">Sin subcategoría</option>{selectableSubcategories.map((subcategory) => <option value={subcategory.id} key={subcategory.id}>{subcategory.name}</option>)}</select></label>
        <label>Unidad<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value as UnitType })}>{unitTypes.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        <label>Stock mínimo<input type="number" min="0" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })} /></label>
        <label>Ubicación principal<select value={form.mainLocationId} onChange={(event) => updateLocation(event.target.value)}><option value="">Sin ubicación</option>{selectableLocations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>
        <label>Proveedor principal<select value={form.mainSupplierId} onChange={(event) => setForm({ ...form, mainSupplierId: event.target.value })}><option value="">Sin proveedor</option>{state.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label>
        <label className="wide">Observaciones<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <div className="wide checkbox-list">
          {state.tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={form.tags.includes(tag.id)} onChange={() => toggleTag(tag.id)} /> {tag.name}</label>)}
        </div>
        <label className="switch"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Activo</label>
        <footer className="form-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button className="primary"><Save size={18} /> Guardar</button>
        </footer>
      </form>
    </Modal>
  );
};
