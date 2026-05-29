import { Plus, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { InventoryState, Product, ProductType, UnitType } from "../types";
import { productStock, supplierName, tagNames } from "../utils/inventory";

const productTypes: ProductType[] = ["fármaco", "apósito", "fungible", "higiene", "nutrición", "otro"];
const unitTypes: UnitType[] = ["unidad", "caja", "blíster", "ampolla", "sobre", "ml", "otro"];

export const Products = ({ state, onSave }: { state: InventoryState; onSave: (product: Product) => void }) => {
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ type: "", category: "", supplier: "", location: "", tag: "" });

  const categories = [...new Set(state.products.map((product) => product.category).filter(Boolean))];
  const locations = [...new Set(state.products.map((product) => product.mainLocation).filter(Boolean))];
  const filtered = useMemo(
    () =>
      state.products.filter((product) => {
        const text = `${product.name} ${product.category} ${product.subcategory} ${product.notes}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (!filters.type || product.type === filters.type) &&
          (!filters.category || product.category === filters.category) &&
          (!filters.supplier || product.mainSupplierId === filters.supplier) &&
          (!filters.location || product.mainLocation === filters.location) &&
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
          {productTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Categoría</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select value={filters.supplier} onChange={(event) => setFilters({ ...filters, supplier: event.target.value })}>
          <option value="">Proveedor</option>
          {state.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}
        </select>
        <select value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}>
          <option value="">Ubicación</option>
          {locations.map((location) => <option key={location}>{location}</option>)}
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
                    <td><strong>{product.name}</strong><span>{product.subcategory}</span></td>
                    <td>{product.type}</td>
                    <td>{product.category}</td>
                    <td><span className={`pill ${stock <= product.minStock ? "danger" : ""}`}>{stock}</span></td>
                    <td>{product.minStock}</td>
                    <td>{product.mainLocation || "Sin ubicación"}</td>
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
  unit: "unidad",
  minStock: 0,
  mainLocation: "",
  mainSupplierId: "",
  tags: [],
  notes: "",
  active: true
});

const ProductModal = ({ product, state, onClose, onSave }: { product: Product; state: InventoryState; onClose: () => void; onSave: (product: Product) => void }) => {
  const [form, setForm] = useState(product);
  const toggleTag = (tagId: string) => setForm({ ...form, tags: form.tags.includes(tagId) ? form.tags.filter((id) => id !== tagId) : [...form.tags, tagId] });

  return (
    <Modal title="Producto" onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ProductType })}>{productTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Categoría<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
        <label>Subcategoría<input value={form.subcategory} onChange={(event) => setForm({ ...form, subcategory: event.target.value })} /></label>
        <label>Unidad<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value as UnitType })}>{unitTypes.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        <label>Stock mínimo<input type="number" min="0" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })} /></label>
        <label>Ubicación principal<input value={form.mainLocation} onChange={(event) => setForm({ ...form, mainLocation: event.target.value })} /></label>
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
