import { Edit2, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Category, InventoryLocation, InventoryState, Product, ProductTypeCatalog, Subcategory } from "../types";

type CatalogTab = "locations" | "types" | "categories" | "subcategories";

type Props = {
  state: InventoryState;
  onSaveLocation: (location: InventoryLocation) => void;
  onSaveProductType: (productType: ProductTypeCatalog) => void;
  onSaveCategory: (category: Category) => void;
  onSaveSubcategory: (subcategory: Subcategory) => void;
};

const tabs: { id: CatalogTab; label: string }[] = [
  { id: "locations", label: "Ubicaciones" },
  { id: "types", label: "Tipos" },
  { id: "categories", label: "Categorías" },
  { id: "subcategories", label: "Subcategorías" }
];

const blankBase = () => ({ id: crypto.randomUUID(), name: "", description: "", active: true });
const catalogName = <T extends { id: string; name: string }>(items: T[], id: string, fallback = "") => items.find((item) => item.id === id)?.name || fallback;
const normalize = (value: string) => value.trim().toLocaleLowerCase("es");

export const Catalogs = ({ state, onSaveLocation, onSaveProductType, onSaveCategory, onSaveSubcategory }: Props) => {
  const [tab, setTab] = useState<CatalogTab>("locations");
  const [editing, setEditing] = useState<InventoryLocation | ProductTypeCatalog | Category | Subcategory | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{ title: string; products: Product[] } | null>(null);

  const productsByLocation = useMemo(() => countProducts(state.locations, state.products, (item, product) => product.mainLocationId === item.id || (!product.mainLocationId && normalize(product.mainLocation) === normalize(item.name))), [state.locations, state.products]);
  const productsByType = useMemo(() => countProducts(state.productTypes, state.products, (item, product) => product.productTypeId === item.id || (!product.productTypeId && normalize(product.type) === normalize(item.name))), [state.productTypes, state.products]);
  const productsByCategory = useMemo(() => countProducts(state.categories, state.products, (item, product) => product.categoryId === item.id || (!product.categoryId && normalize(product.category) === normalize(item.name))), [state.categories, state.products]);
  const productsBySubcategory = useMemo(() => countProducts(state.subcategories, state.products, (item, product) => product.subcategoryId === item.id || (!product.subcategoryId && normalize(product.subcategory) === normalize(item.name))), [state.subcategories, state.products]);

  const showProducts = (title: string, products: Product[]) => setSelectedProducts({ title, products });

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Catálogos</h1>
          <p>Maestros de clasificación usados por los productos.</p>
        </div>
        <button className="primary" onClick={() => setEditing(createBlank(tab))}>
          <Plus size={18} /> Crear
        </button>
      </div>
      <div className="tabs">
        {tabs.map((item) => (
          <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {tab === "locations" && (
        <CatalogTable
          items={state.locations}
          columns={[{ label: "Descripción", render: (item) => item.description || "Sin descripción" }]}
          counts={productsByLocation}
          onEdit={setEditing}
          onProducts={(item) => showProducts(item.name, state.products.filter((product) => product.mainLocationId === item.id || (!product.mainLocationId && normalize(product.mainLocation) === normalize(item.name))))}
        />
      )}
      {tab === "types" && (
        <CatalogTable
          items={state.productTypes}
          columns={[{ label: "Descripción", render: (item) => item.description || "Sin descripción" }]}
          counts={productsByType}
          onEdit={setEditing}
          onProducts={(item) => showProducts(item.name, state.products.filter((product) => product.productTypeId === item.id || (!product.productTypeId && normalize(product.type) === normalize(item.name))))}
        />
      )}
      {tab === "categories" && (
        <CatalogTable
          items={state.categories}
          columns={[
            { label: "Tipo", render: (item) => catalogName(state.productTypes, item.productTypeId, "Sin tipo") },
            { label: "Descripción", render: (item) => item.description || "Sin descripción" }
          ]}
          counts={productsByCategory}
          onEdit={setEditing}
          onProducts={(item) => showProducts(item.name, state.products.filter((product) => product.categoryId === item.id || (!product.categoryId && normalize(product.category) === normalize(item.name))))}
        />
      )}
      {tab === "subcategories" && (
        <CatalogTable
          items={state.subcategories}
          columns={[
            { label: "Categoría", render: (item) => catalogName(state.categories, item.categoryId, "Sin categoría") },
            { label: "Descripción", render: (item) => item.description || "Sin descripción" }
          ]}
          counts={productsBySubcategory}
          onEdit={setEditing}
          onProducts={(item) => showProducts(item.name, state.products.filter((product) => product.subcategoryId === item.id || (!product.subcategoryId && normalize(product.subcategory) === normalize(item.name))))}
        />
      )}
      {editing && (
        <CatalogModal
          item={editing}
          tab={tab}
          state={state}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            if (tab === "locations") onSaveLocation(item as InventoryLocation);
            if (tab === "types") onSaveProductType(item as ProductTypeCatalog);
            if (tab === "categories") onSaveCategory(item as Category);
            if (tab === "subcategories") onSaveSubcategory(item as Subcategory);
            setEditing(null);
          }}
        />
      )}
      {selectedProducts && (
        <ProductsModal title={selectedProducts.title} products={selectedProducts.products} state={state} onClose={() => setSelectedProducts(null)} />
      )}
    </div>
  );
};

const createBlank = (tab: CatalogTab) => {
  if (tab === "categories") return { ...blankBase(), productTypeId: "" };
  if (tab === "subcategories") return { ...blankBase(), categoryId: "" };
  return blankBase();
};

const countProducts = <T extends { id: string }>(items: T[], products: Product[], matches: (item: T, product: Product) => boolean) =>
  Object.fromEntries(items.map((item) => [item.id, products.filter((product) => matches(item, product)).length]));

const CatalogTable = <T extends InventoryLocation | ProductTypeCatalog | Category | Subcategory>({
  items,
  columns,
  counts,
  onEdit,
  onProducts
}: {
  items: T[];
  columns: { label: string; render: (item: T) => string }[];
  counts: Record<string, number>;
  onEdit: (item: T) => void;
  onProducts: (item: T) => void;
}) => (
  <section className="panel">
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            {columns.map((column) => <th key={column.label}>{column.label}</th>)}
            <th>Productos</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={!item.active ? "inactive-row" : ""}>
              <td><strong>{item.name}</strong></td>
              {columns.map((column) => <td key={column.label}>{column.render(item)}</td>)}
              <td>
                <button className="secondary" onClick={() => onProducts(item)}>
                  {counts[item.id] || 0} productos
                </button>
              </td>
              <td><span className="pill">{item.active ? "activo" : "inactivo"}</span></td>
              <td><button className="secondary" onClick={() => onEdit(item)}><Edit2 size={16} /> Editar</button></td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td className="empty-cell" colSpan={columns.length + 4}>Sin registros</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const CatalogModal = ({
  item,
  tab,
  state,
  onClose,
  onSave
}: {
  item: InventoryLocation | ProductTypeCatalog | Category | Subcategory;
  tab: CatalogTab;
  state: InventoryState;
  onClose: () => void;
  onSave: (item: InventoryLocation | ProductTypeCatalog | Category | Subcategory) => void;
}) => {
  const [form, setForm] = useState(item);
  const isCategory = tab === "categories";
  const isSubcategory = tab === "subcategories";

  return (
    <Modal title="Catálogo" onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        {isCategory && (
          <label>Tipo de producto<select value={(form as Category).productTypeId} onChange={(event) => setForm({ ...form, productTypeId: event.target.value } as Category)}><option value="">Sin tipo</option>{state.productTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select></label>
        )}
        {isSubcategory && (
          <label>Categoría<select required value={(form as Subcategory).categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value } as Subcategory)}><option value="">Seleccionar categoría</option>{state.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        )}
        <label className="wide">Descripción<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="switch"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Activo</label>
        <footer className="form-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button className="primary"><Save size={18} /> Guardar</button>
        </footer>
      </form>
    </Modal>
  );
};

const ProductsModal = ({ title, products, state, onClose }: { title: string; products: Product[]; state: InventoryState; onClose: () => void }) => (
  <Modal title={`Productos: ${title}`} onClose={onClose}>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Ubicación</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className={!product.active ? "inactive-row" : ""}>
              <td><strong>{product.name}</strong><span>{catalogName(state.subcategories, product.subcategoryId, product.subcategory)}</span></td>
              <td>{catalogName(state.productTypes, product.productTypeId, product.type)}</td>
              <td>{catalogName(state.categories, product.categoryId, product.category)}</td>
              <td>{catalogName(state.locations, product.mainLocationId, product.mainLocation) || "Sin ubicación"}</td>
              <td><span className="pill">{product.active ? "activo" : "inactivo"}</span></td>
            </tr>
          ))}
          {!products.length && (
            <tr>
              <td className="empty-cell" colSpan={5}>No hay productos asociados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Modal>
);
