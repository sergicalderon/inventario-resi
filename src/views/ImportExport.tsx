import { Download, Upload } from "lucide-react";
import { InventoryState, Product } from "../types";
import { downloadText, parseCsv, toCsv } from "../utils/csv";

export const ImportExport = ({ state, onImport }: { state: InventoryState; onImport: (products: Product[]) => void }) => {
  const exportCsv = (name: string, rows: Record<string, unknown>[]) => downloadText(`${name}.csv`, toCsv(rows));
  const exportJson = () => downloadText("inventario-resi-backup.json", JSON.stringify(state, null, 2), "application/json;charset=utf-8");

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h1>Importar/exportar</h1>
          <p>CSV operativo y copia de datos online en JSON.</p>
        </div>
      </div>
      <section className="panel actions-panel">
        <button className="primary" onClick={() => exportCsv("productos", state.products as unknown as Record<string, unknown>[])}><Download size={18} /> Exportar productos CSV</button>
        <button className="primary" onClick={() => exportCsv("lotes", state.lots as unknown as Record<string, unknown>[])}><Download size={18} /> Exportar lotes CSV</button>
        <button className="primary" onClick={() => exportCsv("movimientos", state.movements as unknown as Record<string, unknown>[])}><Download size={18} /> Exportar movimientos CSV</button>
        <button className="secondary" onClick={exportJson}><Download size={18} /> Copia JSON</button>
      </section>
      <section className="panel">
        <h2>Importar productos desde CSV</h2>
        <label className="file-drop">
          <Upload size={22} />
          <span>Seleccionar CSV con columnas: name, type, category, subcategory, unit, minStock, mainLocation, mainSupplierId, notes</span>
          <input type="file" accept=".csv,text/csv" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const rows = parseCsv(await file.text());
            const products = rows.map((row) => ({
              id: crypto.randomUUID(),
              name: row.name || "",
              type: (row.type || "otro") as Product["type"],
              category: row.category || "",
              subcategory: row.subcategory || "",
              productTypeId: row.productTypeId || "",
              categoryId: row.categoryId || "",
              subcategoryId: row.subcategoryId || "",
              unit: (row.unit || "unidad") as Product["unit"],
              minStock: Number(row.minStock || 0),
              mainLocation: row.mainLocation || "",
              mainLocationId: row.mainLocationId || "",
              mainSupplierId: row.mainSupplierId || "",
              tags: [],
              notes: row.notes || "",
              active: true
            })).filter((product) => product.name);
            onImport(products);
          }} />
        </label>
      </section>
    </div>
  );
};
