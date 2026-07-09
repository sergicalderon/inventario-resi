import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { InventoryState, RecentActivity as RecentActivityRecord } from "../types";

const actionLabels: Record<string, string> = {
  producto_creado: "Producto creado",
  producto_editado: "Producto editado",
  producto_desactivado: "Producto desactivado",
  lote_creado: "Lote creado",
  lote_editado: "Lote editado",
  entrada_stock: "Entrada de stock",
  salida_stock: "Salida de stock",
  ajuste_inventario: "Ajuste de inventario",
  devolucion_stock: "Devolución",
  stock_caducado: "Caducado",
  traslado_stock: "Traslado",
  proveedor_creado: "Proveedor creado",
  proveedor_editado: "Proveedor editado",
  ubicacion_creada: "Ubicación creada",
  ubicacion_editada: "Ubicación editada",
  tipo_producto_creado: "Tipo de producto creado",
  tipo_producto_editado: "Tipo de producto editado",
  categoria_creada: "Categoría creada",
  categoria_editada: "Categoría editada",
  subcategoria_creada: "Subcategoría creada",
  subcategoria_editada: "Subcategoría editada"
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));

const displayName = (activity: RecentActivityRecord) =>
  activity.productName || activity.entityName || "Sin nombre";

export const RecentActivity = ({
  state,
  onOpenProduct
}: {
  state: InventoryState;
  onOpenProduct: (productId: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [date, setDate] = useState("");

  const actions = useMemo(
    () => [...new Set(state.recentActivity.map((activity) => activity.action))].sort((a, b) => actionLabel(a).localeCompare(actionLabel(b), "es")),
    [state.recentActivity]
  );

  const filtered = useMemo(
    () =>
      state.recentActivity.filter((activity) => {
        const text = `${activity.productName} ${activity.lotCode} ${activity.entityName}`.toLocaleLowerCase("es");
        const activityDate = activity.occurredAt.slice(0, 10);
        return (
          text.includes(query.toLocaleLowerCase("es")) &&
          (!action || activity.action === action) &&
          (!date || activityDate === date)
        );
      }),
    [action, date, query, state.recentActivity]
  );

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Actividad reciente</h1>
          <p>Últimos 50 cambios registrados, combinando movimientos de stock y auditoría.</p>
        </div>
      </div>

      <div className="filters activity-filters">
        <label className="search">
          <Search size={16} />
          <input placeholder="Buscar producto, lote o nombre" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select value={action} onChange={(event) => setAction(event.target.value)}>
          <option value="">Acción</option>
          {actions.map((item) => (
            <option value={item} key={item}>
              {actionLabel(item)}
            </option>
          ))}
        </select>
        <input aria-label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Acción</th>
                <th>Producto</th>
                <th>Lote</th>
                <th>Usuario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((activity) => (
                <tr key={activity.id}>
                  <td>{formatDateTime(activity.occurredAt)}</td>
                  <td>
                    <span className="pill">{actionLabel(activity.action)}</span>
                    {activity.quantity !== null && <span>{activity.quantity} unidades</span>}
                  </td>
                  <td>
                    <strong>{displayName(activity)}</strong>
                    {activity.entityName && activity.entityName !== displayName(activity) && <span>{activity.entityName}</span>}
                  </td>
                  <td>{activity.lotCode || "Sin lote"}</td>
                  <td>{activity.actorEmail || "No disponible"}</td>
                  <td>
                    {activity.productId ? (
                      <button className="secondary" onClick={() => onOpenProduct(activity.productId)}>
                        <ExternalLink size={16} /> Abrir producto
                      </button>
                    ) : (
                      <span className="muted">Sin producto</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No hay actividad con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const actionLabel = (action: string) => actionLabels[action] || action;
