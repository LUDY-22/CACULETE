export type UserRole = 'admin' | 'manager' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  storeId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  barcode: string;
  imageUrl?: string;
  storeId: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
  cashierId: string;
  storeId: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  storeId: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  storeId: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  storeId: string;
}
