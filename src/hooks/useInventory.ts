import { useEffect, useMemo, useState } from "react";
import {
  addMovement,
  createOrganization,
  getOrganizations,
  getState,
  importProducts,
  setLotStatus,
  upsertLot,
  upsertProduct,
  upsertSupplier,
  upsertTag
} from "../db/supabaseStorage";
import { Organization } from "../db/supabaseStorage";
import { InventoryState, Lot, Movement, Product, Supplier, Tag } from "../types";

const emptyState: InventoryState = { products: [], lots: [], movements: [], suppliers: [], tags: [] };

export const useInventory = (enabled: boolean) => {
  const [state, setState] = useState(emptyState);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refreshOrganizations = async () => {
    const loaded = await getOrganizations();
    setOrganizations(loaded);
    if (!organizationId && loaded[0]) setOrganizationId(loaded[0].id);
    return loaded;
  };

  const refresh = async (targetOrganizationId = organizationId) => {
    if (!targetOrganizationId) return;
    setState(await getState(targetOrganizationId));
  };

  useEffect(() => {
    if (!enabled) return;
    setReady(false);
    refreshOrganizations()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "No se pudieron cargar las residencias."))
      .finally(() => setReady(true));
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !organizationId) return;
    setReady(false);
    refresh(organizationId)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "No se pudo cargar el inventario."))
      .finally(() => setReady(true));
  }, [enabled, organizationId]);

  const actions = useMemo(
    () => ({
      createOrganization: async (name: string) => {
        const organization = await createOrganization(name);
        const loaded = await refreshOrganizations();
        setOrganizationId(organization.id || loaded[0]?.id || "");
      },
      saveProduct: async (product: Product) => {
        await upsertProduct(organizationId, product);
        await refresh();
      },
      saveLot: async (lot: Lot) => {
        await upsertLot(organizationId, lot);
        await refresh();
      },
      saveSupplier: async (supplier: Supplier) => {
        await upsertSupplier(organizationId, supplier);
        await refresh();
      },
      saveTag: async (tag: Tag) => {
        await upsertTag(organizationId, tag);
        await refresh();
      },
      registerMovement: async (movement: Partial<Movement> & Pick<Movement, "productId" | "type" | "quantity">) => {
        await addMovement(organizationId, movement);
        await refresh();
      },
      updateLotStatus: async (lotId: string, status: Lot["status"]) => {
        await setLotStatus(organizationId, lotId, status);
        await refresh();
      },
      importProductRows: async (products: Product[]) => {
        await importProducts(organizationId, products);
        await refresh();
      },
      selectOrganization: setOrganizationId
    }),
    [organizationId]
  );

  return { state, ready, error, organizations, organizationId, actions };
};
