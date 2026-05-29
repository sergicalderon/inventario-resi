import { InventoryState } from "../types";

export const seedState: InventoryState = {
  locations: [],
  productTypes: [],
  categories: [],
  subcategories: [],
  suppliers: [
    {
      id: "sup-1",
      name: "Farmacia Sanitaria Central",
      contact: "Marta López",
      phone: "910 223 104",
      email: "pedidos@farmaciasanitaria.example",
      notes: "Proveedor habitual para medicación crónica."
    },
    {
      id: "sup-2",
      name: "Suministros Clínicos Norte",
      contact: "Javier Ruiz",
      phone: "944 182 770",
      email: "norte@suministrosclinicos.example",
      notes: "Apósitos, guantes y material fungible."
    }
  ],
  tags: [
    { id: "tag-1", name: "pedido mensual" },
    { id: "tag-2", name: "urgente" },
    { id: "tag-3", name: "carro curas" },
    { id: "tag-4", name: "farmacia" },
    { id: "tag-5", name: "planta 1" },
    { id: "tag-6", name: "caducidad próxima" },
    { id: "tag-7", name: "proveedor habitual" }
  ],
  products: [
    {
      id: "prod-1",
      name: "Paracetamol 1g",
      type: "fármaco",
      category: "Analgésicos",
      subcategory: "Oral",
      productTypeId: "",
      categoryId: "",
      subcategoryId: "",
      unit: "caja",
      minStock: 12,
      mainLocation: "Farmacia central",
      mainLocationId: "",
      mainSupplierId: "sup-1",
      tags: ["tag-1", "tag-4", "tag-7"],
      notes: "Revisar consumo semanal.",
      active: true
    },
    {
      id: "prod-2",
      name: "Apósito hidrocoloide 10x10",
      type: "apósito",
      category: "Curas",
      subcategory: "Hidrocoloides",
      productTypeId: "",
      categoryId: "",
      subcategoryId: "",
      unit: "unidad",
      minStock: 30,
      mainLocation: "Carro curas planta 1",
      mainLocationId: "",
      mainSupplierId: "sup-2",
      tags: ["tag-3", "tag-5"],
      notes: "",
      active: true
    },
    {
      id: "prod-3",
      name: "Guantes nitrilo talla M",
      type: "fungible",
      category: "Protección",
      subcategory: "Guantes",
      productTypeId: "",
      categoryId: "",
      subcategoryId: "",
      unit: "caja",
      minStock: 20,
      mainLocation: "",
      mainLocationId: "",
      mainSupplierId: "sup-2",
      tags: ["tag-1"],
      notes: "Alta rotación.",
      active: true
    }
  ],
  lots: [
    {
      id: "lot-1",
      productId: "prod-1",
      lotCode: "PAR-0426-A",
      expiresAt: "2026-06-18",
      currentQuantity: 8,
      entryDate: "2026-05-04",
      supplierId: "sup-1",
      notes: "",
      status: "activo"
    },
    {
      id: "lot-2",
      productId: "prod-2",
      lotCode: "HID-2512",
      expiresAt: "2026-08-12",
      currentQuantity: 44,
      entryDate: "2026-04-28",
      supplierId: "sup-2",
      notes: "",
      status: "activo"
    },
    {
      id: "lot-3",
      productId: "prod-3",
      lotCode: "NIT-M-11",
      expiresAt: "2027-01-20",
      currentQuantity: 16,
      entryDate: "2026-05-12",
      supplierId: "sup-2",
      notes: "",
      status: "activo"
    }
  ],
  movements: [
    {
      id: "mov-1",
      date: "2026-05-26",
      productId: "prod-1",
      lotId: "lot-1",
      type: "salida",
      quantity: 4,
      reason: "Reposición planta 1",
      responsible: "Enfermería turno mañana",
      notes: ""
    }
  ]
};
