import { Building2, Plus } from "lucide-react";
import { useState } from "react";

export const OrganizationSetup = ({ onCreate }: { onCreate: (name: string) => Promise<void> }) => {
  const [name, setName] = useState("Residencia");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-heading">
          <Building2 size={36} />
          <div>
            <h1>Crear residencia</h1>
            <p>Este será el espacio privado de inventario para tu equipo.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onCreate(name);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "No se pudo crear la residencia.");
          } finally {
            setBusy(false);
          }
        }}>
          <label>Nombre de la residencia<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
          {error && <p className="form-message">{error}</p>}
          <button className="primary" disabled={busy}><Plus size={18} /> {busy ? "Creando..." : "Crear residencia"}</button>
        </form>
      </section>
    </main>
  );
};
