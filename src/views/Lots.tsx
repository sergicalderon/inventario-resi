import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { InventoryState, Lot } from "../types";
import { daysUntil, expiryWindow, todayIso } from "../utils/dates";
import { productName, supplierName } from "../utils/inventory";

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
  const sorted = useMemo(() => [...state.lots].sort((a, b) => daysUntil(a.expiresAt) - daysUntil(b.expiresAt)), [state.lots]);

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
                <th>Producto</th>
                <th>Lote</th>
                <th>Caducidad</th>
                <th>Cantidad</th>
                <th>Entrada</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((lot) => {
                const days = daysUntil(lot.expiresAt);
                return (
                  <tr key={lot.id}>
                    <td>{productName(state, lot.productId)}</td>
                    <td><strong>{lot.lotCode}</strong><span>{lot.notes}</span></td>
                    <td><span className={`pill ${days <= 30 ? "danger" : days <= 90 ? "warning" : ""}`}>{lot.expiresAt} · {expiryWindow(lot.expiresAt) || `${days} días`}</span></td>
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
