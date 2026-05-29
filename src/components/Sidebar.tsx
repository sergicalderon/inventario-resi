import { Boxes, DatabaseBackup, Gauge, Package, Tags, Truck, Warehouse } from "lucide-react";
import { Organization } from "../db/supabaseStorage";

type Props = {
  current: string;
  email?: string;
  organizationId: string;
  organizations: Organization[];
  onChange: (view: string) => void;
  onOrganizationChange: (organizationId: string) => void;
  onSignOut: () => void;
};

const items = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "products", label: "Productos", icon: Package },
  { id: "lots", label: "Lotes", icon: Boxes },
  { id: "movements", label: "Movimientos", icon: Warehouse },
  { id: "suppliers", label: "Proveedores", icon: Truck },
  { id: "tags", label: "Etiquetas", icon: Tags },
  { id: "io", label: "Importar/exportar", icon: DatabaseBackup }
];

export const Sidebar = ({ current, email, organizationId, organizations, onChange, onOrganizationChange, onSignOut }: Props) => (
  <aside className="sidebar">
    <div className="brand">
      <span className="brand-mark">IR</span>
      <div>
        <strong>Inventario Resi</strong>
        <small>Control sanitario local</small>
      </div>
    </div>
    <div className="workspace-box">
      <label>
        Residencia
        <select value={organizationId} onChange={(event) => onOrganizationChange(event.target.value)}>
          {organizations.map((organization) => (
            <option value={organization.id} key={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      <small>{email}</small>
    </div>
    <nav>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button className={current === item.id ? "active" : ""} key={item.id} onClick={() => onChange(item.id)}>
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>
    <button className="signout-button" onClick={onSignOut}>
      Cerrar sesión
    </button>
  </aside>
);
