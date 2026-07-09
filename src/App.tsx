import { useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { OrganizationSetup } from "./components/OrganizationSetup";
import { Sidebar } from "./components/Sidebar";
import { supabase } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { Catalogs } from "./views/Catalogs";
import { Dashboard } from "./views/Dashboard";
import { ImportExport } from "./views/ImportExport";
import { Lots } from "./views/Lots";
import { Movements } from "./views/Movements";
import { Products } from "./views/Products";
import { RecentActivity } from "./views/RecentActivity";
import { Suppliers } from "./views/Suppliers";
import { Tags } from "./views/Tags";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [openProductId, setOpenProductId] = useState("");
  const { session, ready: authReady } = useAuth();
  const { state, ready, error, organizations, organizationId, actions } = useInventory(Boolean(session));

  if (!authReady) return <main className="loading">Preparando acceso...</main>;
  if (!session) return <AuthScreen />;
  if (error) return <main className="loading error-state">{error}</main>;
  if (!ready) return <main className="loading">Cargando inventario online...</main>;
  if (!organizations.length) return <OrganizationSetup onCreate={actions.createOrganization} />;

  return (
    <div className="app-shell">
      <Sidebar
        current={view}
        email={session.user.email}
        organizationId={organizationId}
        organizations={organizations}
        onChange={setView}
        onOrganizationChange={actions.selectOrganization}
        onSignOut={() => supabase.auth.signOut()}
      />
      <main className="content">
        {view === "dashboard" && <Dashboard state={state} />}
        {view === "products" && <Products state={state} onSave={actions.saveProduct} openProductId={openProductId} onProductOpened={() => setOpenProductId("")} />}
        {view === "lots" && <Lots state={state} onSave={actions.saveLot} onStatus={actions.updateLotStatus} />}
        {view === "movements" && <Movements state={state} onRegister={actions.registerMovement} />}
        {view === "activity" && (
          <RecentActivity
            state={state}
            onOpenProduct={(productId) => {
              setOpenProductId(productId);
              setView("products");
            }}
          />
        )}
        {view === "suppliers" && <Suppliers state={state} onSave={actions.saveSupplier} />}
        {view === "tags" && <Tags state={state} onSave={actions.saveTag} />}
        {view === "catalogs" && (
          <Catalogs
            state={state}
            onSaveLocation={actions.saveLocation}
            onSaveProductType={actions.saveProductType}
            onSaveCategory={actions.saveCategory}
            onSaveSubcategory={actions.saveSubcategory}
          />
        )}
        {view === "io" && <ImportExport state={state} onImport={actions.importProductRows} />}
      </main>
    </div>
  );
}
