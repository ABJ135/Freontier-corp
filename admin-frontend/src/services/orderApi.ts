import api from "../lib/api";
import type { Order, OrderStatus } from "../types/order";

/**
 * Fetch all orders.
 * Endpoint: GET /orders
 */
export async function getOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>("/orders");
  return response.data;
}

/**
 * Fetch a single order by ID.
 * Endpoint: GET /orders/:id
 */
export async function getOrder(id: string): Promise<Order> {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
}

/**
 * Update the status of an order.
 * Endpoint: PATCH /orders/:id/status
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status });
  return response.data;
}
