import { AlertTriangle, CalendarClock, CircleHelp, PackageCheck } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { InventoryState } from "../types";
import { daysUntil, expiryWindow } from "../utils/dates";
import { activeLotsByExpiry, lotName, productName, productStock, supplierName } from "../utils/inventory";

export const Dashboard = ({ state }: { state: InventoryState }) => {
  const activeProducts = state.products.filter((product) => product.active);
  const lowStock = activeProducts.filter((product) => productStock(product.id, state.lots) <= product.minStock);
  const expiryLots = activeLotsByExpiry(state.lots).filter((lot) => daysUntil(lot.expiresAt) <= 90);
  const missingData = activeProducts.filter((product) => !product.mainLocation || !product.mainSupplierId);

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen operativo del inventario sanitario.</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Productos activos" value={activeProducts.length}>
          <PackageCheck size={16} /> Registrados y disponibles
        </StatCard>
        <StatCard label="Stock bajo" value={lowStock.length} tone={lowStock.length ? "danger" : ""}>
          <AlertTriangle size={16} /> Bajo mínimo definido
        </StatCard>
        <StatCard label="Caducidad 90 días" value={expiryLots.length} tone={expiryLots.length ? "warning" : ""}>
          <CalendarClock size={16} /> Lotes activos
        </StatCard>
        <StatCard label="Datos incompletos" value={missingData.length} tone={missingData.length ? "soft" : ""}>
          <CircleHelp size={16} /> Sin ubicación o proveedor
        </StatCard>
      </div>

      <div className="two-column">
        <section className="panel">
          <h2>Stock bajo mínimo</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                      <span className="pill danger">{productStock(product.id, state.lots)}</span>
                    </td>
                    <td>{product.minStock}</td>
                    <td>{product.mainLocation || "Sin ubicación"}</td>
                  </tr>
                ))}
                {!lowStock.length && <EmptyRow cols={4} text="Sin productos bajo mínimo" />}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>Caducidad próxima</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Caduca</th>
                  <th>Ventana</th>
                </tr>
              </thead>
              <tbody>
                {expiryLots.map((lot) => (
                  <tr key={lot.id}>
                    <td>{productName(state, lot.productId)}</td>
                    <td>{lotName(state, lot.id)}</td>
                    <td>{lot.expiresAt}</td>
                    <td>
                      <span className={`pill ${daysUntil(lot.expiresAt) <= 30 ? "danger" : "warning"}`}>{expiryWindow(lot.expiresAt)}</span>
                    </td>
                  </tr>
                ))}
                {!expiryLots.length && <EmptyRow cols={4} text="Sin caducidades próximas" />}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Últimos movimientos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {state.movements.slice(0, 8).map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.date}</td>
                  <td>{productName(state, movement.productId)}</td>
                  <td>{movement.lotId ? lotName(state, movement.lotId) : "Sin lote"}</td>
                  <td>
                    <span className="pill">{movement.type}</span>
                  </td>
                  <td>{movement.quantity}</td>
                  <td>{movement.responsible || "Sin responsable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Productos sin ubicación o proveedor</h2>
        <div className="list-grid">
          {missingData.map((product) => (
            <div className="mini-card" key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.mainLocation || "Sin ubicación"} · {product.mainSupplierId ? supplierName(state, product.mainSupplierId) : "Sin proveedor"}</span>
            </div>
          ))}
          {!missingData.length && <p className="muted">Todo el catálogo activo tiene datos principales.</p>}
        </div>
      </section>
    </div>
  );
};

const EmptyRow = ({ cols, text }: { cols: number; text: string }) => (
  <tr>
    <td colSpan={cols} className="empty-cell">
      {text}
    </td>
  </tr>
);
