export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
  role: 'admin' | 'customer';
  createdAt?: Date;
  updatedAt?: Date;
}

// Adicione no final do arquivo

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  documentId: string; // NIF/BI
  address: string;
  city: string;
  commissionRate: number; // Percentagem da comissão (ex: 15 = 15%)
  status: 'active' | 'inactive' | 'pending';
  totalSales: number;
  totalCommission: number;
  totalProducts: number;
  products: string[]; // IDs dos produtos
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  bankInfo?: {
    bank: string;
    account: string;
    iban: string;
  };
  logo?: string;
  description?: string;
}

export interface PartnerProduct {
  id: string;
  partnerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  partnerPrice: number;
  commission: number; // Valor da comissão calculado
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerCommission {
  id: string;
  partnerId: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  commissionRate: number;
  commissionValue: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  rating: number;
  image: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem extends Product {
  qty: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  category?: string;
  brand?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: 'awaiting_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentProof:string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type Status = Order['status'];

export const STATUS_LABELS: Record<Status, string> = {
  awaiting_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const STATUS_COLORS: Record<Status, string> = {
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
