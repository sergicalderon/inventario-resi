import { ChevronDown, ChevronUp, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { InventoryState, Lot } from "../types";
import { daysUntil, expiryWindow, todayIso } from "../utils/dates";
import { productName, supplierName } from "../utils/inventory";

type SortMode = "expiry-asc" | "expiry-desc" | "product-asc" | "product-desc";

export const Lots = ({
  state,
  onSave,
  onStatus
}: {
  state: InventoryState;
  onSave: (lot: Lot) => void;
  onStatus: (lotId: string, status: Lot["status"]) => void;
}) => {
  const [editing, setEditing] = useState<Lot | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("expiry-asc");
  const productNames = useMemo(() => new Map(state.products.map((product) => [product.id, product.name])), [state.products]);
  const sorted = useMemo(() => {
    const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
    const getProductName = (lot: Lot) => productNames.get(lot.productId) || "Producto eliminado";
    const compareNames = (a: string, b: string) => collator.compare(a, b);
    const compareLots = (a: Lot, b: Lot) => compareNames(a.lotCode, b.lotCode);
    const compareExpiry = (a: Lot, b: Lot, direction: "asc" | "desc" = "asc") => {
      const aTime = expiryTime(a.expiresAt);
      const bTime = expiryTime(b.expiresAt);
      const aMissing = aTime === null;
      const bMissing = bTime === null;

      if (aMissing && bMissing) return compareLots(a, b);
      if (aMissing) return 1;
      if (bMissing) return -1;

      const expiryComparison = direction === "asc" ? aTime - bTime : bTime - aTime;
      return expiryComparison || compareNames(getProductName(a), getProductName(b)) || compareLots(a, b);
    };

    return [...state.lots].sort((a, b) => {
      if (sortMode === "expiry-asc") return compareExpiry(a, b, "asc");
      if (sortMode === "expiry-desc") return compareExpiry(a, b, "desc");

      const nameComparison = compareNames(getProductName(a), getProductName(b));
      if (nameComparison) return sortMode === "product-asc" ? nameComparison : -nameComparison;
      return compareExpiry(a, b, "asc");
    });
  }, [productNames, sortMode, state.lots]);

  const toggleProductSort = () => setSortMode((current) => (current === "product-asc" ? "product-desc" : "product-asc"));
  const toggleExpirySort = () => setSortMode((current) => (current === "expiry-asc" ? "expiry-desc" : "expiry-asc"));

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Lotes</h1>
          <p>Seguimiento por caducidad, proveedor y cantidad actual.</p>
        </div>
        <button className="primary" onClick={() => setEditing(blankLot(state.products[0]?.id || "", state.suppliers[0]?.id || ""))}>
          <Plus size={18} /> Añadir lote
        </button>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button className={`sort-header ${sortMode.startsWith("product") ? "active" : ""}`} onClick={toggleProductSort} type="button">
                    Producto
                    {sortMode === "product-asc" && <ChevronUp size={14} aria-hidden="true" />}
                    {sortMode === "product-desc" && <ChevronDown size={14} aria-hidden="true" />}
                  </button>
                </th>
                <th>Lote</th>
                <th>
                  <button className={`sort-header ${sortMode.startsWith("expiry") ? "active" : ""}`} onClick={toggleExpirySort} type="button">
                    Caducidad
                    {sortMode === "expiry-asc" && <ChevronUp size={14} aria-hidden="true" />}
                    {sortMode === "expiry-desc" && <ChevronDown size={14} aria-hidden="true" />}
                  </button>
                </th>
                <th>Cantidad</th>
                <th>Entrada</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((lot) => {
                const hasExpiry = Boolean(lot.expiresAt);
                const days = hasExpiry ? daysUntil(lot.expiresAt) : null;
                return (
                  <tr key={lot.id}>
                    <td>{productName(state, lot.productId)}</td>
                    <td><strong>{lot.lotCode}</strong><span>{lot.notes}</span></td>
                    <td>
                      {hasExpiry ? (
                        <span className={`pill ${days !== null && days <= 30 ? "danger" : days !== null && days <= 90 ? "warning" : ""}`}>
                          {lot.expiresAt} · {expiryWindow(lot.expiresAt) || `${days} días`}
                        </span>
                      ) : (
                        <span className="pill">Sin fecha</span>
                      )}
                    </td>
                    <td>{lot.currentQuantity}</td>
                    <td>{lot.entryDate}</td>
                    <td>{lot.supplierId ? supplierName(state, lot.supplierId) : "Sin proveedor"}</td>
                    <td><span className="pill">{lot.status}</span></td>
                    <td className="row-actions">
                      <button className="secondary" onClick={() => setEditing(lot)}>Editar</button>
                      <button className="secondary" onClick={() => onStatus(lot.id, "agotado")}>Agotado</button>
                      <button className="secondary danger-text" onClick={() => onStatus(lot.id, "caducado")}>Caducado</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <LotModal
          lot={editing}
          state={state}
          onClose={() => setEditing(null)}
          onSave={(lot) => {
            onSave(lot);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const expiryTime = (date: string) => {
  if (!date) return null;
  const time = new Date(`${date}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
};

const blankLot = (productId: string, supplierId: string): Lot => ({
  id: crypto.randomUUID(),
  productId,
  lotCode: "",
  expiresAt: todayIso(),
  currentQuantity: 0,
  entryDate: todayIso(),
  supplierId,
  notes: "",
  status: "activo"
});

const LotModal = ({ lot, state, onClose, onSave }: { lot: Lot; state: InventoryState; onClose: () => void; onSave: (lot: Lot) => void }) => {
  const [form, setForm] = useState(lot);
  return (
    <Modal title="Lote" onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label>Producto<select required value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>{state.products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
        <label>Lote<input required value={form.lotCode} onChange={(event) => setForm({ ...form, lotCode: event.target.value })} /></label>
        <label>Fecha de caducidad<input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
        <label>Cantidad actual<input type="number" min="0" value={form.currentQuantity} onChange={(event) => setForm({ ...form, currentQuantity: Number(event.target.value) })} /></label>
        <label>Fecha de entrada<input type="date" value={form.entryDate} onChange={(event) => setForm({ ...form, entryDate: event.target.value })} /></label>
        <label>Proveedor<select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}><option value="">Sin proveedor</option>{state.suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label>
        <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Lot["status"] })}><option>activo</option><option>agotado</option><option>caducado</option></select></label>
        <label className="wide">Observaciones<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <footer className="form-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button className="primary"><Save size={18} /> Guardar</button>
        </footer>
      </form>
    </Modal>
  );
};
