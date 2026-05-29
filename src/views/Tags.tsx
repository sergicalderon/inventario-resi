import { Plus } from "lucide-react";
import { useState } from "react";
import { InventoryState, Tag } from "../types";

export const Tags = ({ state, onSave }: { state: InventoryState; onSave: (tag: Tag) => void }) => {
  const [name, setName] = useState("");
  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Etiquetas</h1>
          <p>Clasificación libre para búsquedas, pedidos y ubicaciones.</p>
        </div>
      </div>
      <section className="panel">
        <form className="inline-form" onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onSave({ id: crypto.randomUUID(), name: name.trim() });
          setName("");
        }}>
          <input placeholder="Nueva etiqueta" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="primary"><Plus size={18} /> Crear</button>
        </form>
        <div className="tag-cloud">
          {state.tags.map((tag) => <span className="pill" key={tag.id}>{tag.name}</span>)}
        </div>
      </section>
    </div>
  );
};
