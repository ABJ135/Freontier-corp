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

export interface Order {
  id: string;
  orderNumber?: string;
  userId?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  status: OrderStatus;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}
