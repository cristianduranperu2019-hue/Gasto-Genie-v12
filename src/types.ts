export type MainCategory = string;
export type FoodSubcategory = string;

export interface ReceiptItem {
  nombre: string;
  precio: number;
  cantidad: number;
  precioUnitario: number;
  categoria: MainCategory;
  subcategoria: FoodSubcategory | null;
}

export interface ReceiptData {
  transaccion: {
    lugar: string;
    fecha: string; // ISO AAAA-MM-DD
    comprador: string; // Quien realizó la compra (shopper)
    pagador: string;   // Quien puso el dinero (payer)
    total_final: number;
  };
  productos: ReceiptItem[];
  firestoreId?: string;
  id?: string;
}

export interface FamilyContribution {
  name: string;
  amount: number;
  color: string;
}
