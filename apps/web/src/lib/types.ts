export type SaleStatus = "SENT" | "PREPARING" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "PAID" | "FAILED" | "PENDING";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  position: number;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  subcategoriesCount: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  brand: string;
  gender: string;
  imageUrl: string | null;
  price: number;
  options: Array<{ name: string; values: string[] }>;
}

export interface SaleHistory {
  id: string;
  saleId: string;
  status: SaleStatus;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: SaleItem[];
  histories?: SaleHistory[];
}

export interface DashboardStats {
  inventory: {
    totalProducts: number;
    totalValue: number;
    products: Array<{ id: string; name: string; price: number }>;
  };
  recentSales: Array<{
    id: string;
    customerName: string;
    total: number;
    orderNumber: string;
    status: SaleStatus;
    createdAt: string;
  }>;
  topProducts: Array<{ id: string; name: string; sold: number }>;
}
