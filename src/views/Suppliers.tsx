import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { Modal } from "../components/Modal";
import { InventoryState, Supplier } from "../types";

export const Suppliers = ({ state, onSave }: { state: InventoryState; onSave: (supplier: Supplier) => void }) => {
  const [editing, setEditing] = useState<Supplier | null>(null);
  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Proveedores</h1>
          <p>Contactos principales para pedidos y reposiciones.</p>
        </div>
        <button className="primary" onClick={() => setEditing(blankSupplier())}><Plus size={18} /> Crear proveedor</button>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Observaciones</th><th></th></tr></thead>
            <tbody>
              {state.suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td><strong>{supplier.name}</strong></td>
                  <td>{supplier.contact}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.notes}</td>
                  <td><button className="secondary" onClick={() => setEditing(supplier)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <SupplierModal supplier={editing} onClose={() => setEditing(null)} onSave={(supplier) => { onSave(supplier); setEditing(null); }} />}
    </div>
  );
};

const blankSupplier = (): Supplier => ({ id: crypto.randomUUID(), name: "", contact: "", phone: "", email: "", notes: "" });

const SupplierModal = ({ supplier, onClose, onSave }: { supplier: Supplier; onClose: () => void; onSave: (supplier: Supplier) => void }) => {
  const [form, setForm] = useState(supplier);
  return (
    <Modal title="Proveedor" onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Contacto<input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></label>
        <label>Teléfono<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="wide">Observaciones<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <footer className="form-actions wide"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary"><Save size={18} /> Guardar</button></footer>
      </form>
    </Modal>
  );
};
