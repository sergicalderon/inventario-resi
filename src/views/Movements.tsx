import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { InventoryState, Movement, MovementType } from "../types";
import { todayIso } from "../utils/dates";
import { lotName, productName } from "../utils/inventory";

const movementTypes: MovementType[] = ["entrada", "salida", "ajuste", "devolución", "caducado", "traslado"];

export const Movements = ({ state, onRegister }: { state: InventoryState; onRegister: (movement: Partial<Movement> & Pick<Movement, "productId" | "type" | "quantity">) => void }) => {
  const [form, setForm] = useState({
    productId: state.products[0]?.id || "",
    lotId: "",
    type: "salida" as MovementType,
    quantity: 1,
    reason: "",
    responsible: "",
    notes: ""
  });
  const productLots = useMemo(() => state.lots.filter((lot) => lot.productId === form.productId), [state.lots, form.productId]);

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Movimientos</h1>
          <p>Entradas, salidas, ajustes, devoluciones, caducados y traslados.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Registrar movimiento</h2>
        <form className="movement-form" onSubmit={(event) => {
          event.preventDefault();
          onRegister({ ...form, date: todayIso() });
          setForm({ ...form, quantity: 1, reason: "", notes: "" });
        }}>
          <label>Producto<select required value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value, lotId: "" })}>{state.products.filter((product) => product.active).map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
          <label>Lote<select value={form.lotId} onChange={(event) => setForm({ ...form, lotId: event.target.value })}><option value="">Sin lote</option>{productLots.map((lot) => <option value={lot.id} key={lot.id}>{lot.lotCode} · {lot.currentQuantity}</option>)}</select></label>
          <label>Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as MovementType })}>{movementTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Cantidad<input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label>
          <label>Motivo<input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
          <label>Responsable<input value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} /></label>
          <label className="wide">Observaciones<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <button className="primary"><Plus size={18} /> Registrar</button>
        </form>
      </section>
      <section className="panel">
        <h2>Histórico</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {state.movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.date}</td>
                  <td>{productName(state, movement.productId)}</td>
                  <td>{movement.lotId ? lotName(state, movement.lotId) : "Sin lote"}</td>
                  <td><span className="pill">{movement.type}</span></td>
                  <td>{movement.quantity}</td>
                  <td>{movement.reason}</td>
                  <td>{movement.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
