export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemProduct {
  id: string;
  name: string;
  sku: string;
  images?: { imageUrl: string; isPrimary?: boolean }[];
}

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  quantity: number;
  priceCents: number;
  product?: OrderItemProduct;
}

export interface OrderShippingAddress {
  id: string;
  label?: string | null;
  fullName: string;
  phone?: string | null;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  // Nested customer object from backend
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    createdAt?: string;
  } | null;
  // Legacy flat fields (kept for backward compat)
  userId?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  // Shipping
  shippingAddress?: OrderShippingAddress | null;
  shippingAddressSnapshot?: string | null; // JSON string snapshot
  status: OrderStatus;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

