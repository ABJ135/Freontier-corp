import api from "../lib/api";
import type {
  CreateCustomerPayload,
  Customer,
  UpdateCustomerPayload,
} from "../types/customer";
import type { Order } from "../types/order";

/**
 * Fetch all active customers.
 * Endpoint: GET /customers
 */
export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get<Customer[]>("/customers");
  return response.data;
}

/**
 * Fetch all inactive/deactivated customers.
 * Endpoint: GET /customers/inactive
 */
export async function getInactiveCustomers(): Promise<Customer[]> {
  const response = await api.get<Customer[]>("/customers/inactive");
  return response.data;
}

/**
 * Fetch single customer details by ID.
 * Endpoint: GET /customers/:id
 */
export async function getCustomer(id: string): Promise<Customer> {
  const response = await api.get<Customer>(`/customers/${id}`);
  return response.data;
}

/**
 * Fetch all orders belonging to a customer.
 * Endpoint: GET /customers/:id/orders
 */
export async function getCustomerOrders(id: string): Promise<Order[]> {
  const response = await api.get<Order[]>(`/customers/${id}/orders`);
  return response.data;
}

/**
 * Create a new customer (Admin role).
 * Endpoint: POST /customers
 */
export async function createCustomer(
  data: CreateCustomerPayload,
): Promise<Customer> {
  const response = await api.post<Customer>("/customers", data);
  return response.data;
}

/**
 * Update an existing customer (Admin role).
 * Endpoint: PATCH /customers/:id
 */
export async function updateCustomer(
  id: string,
  data: UpdateCustomerPayload,
): Promise<Customer> {
  const response = await api.patch<Customer>(`/customers/${id}`, data);
  return response.data;
}

/**
 * Deactivate / Soft delete a customer (Admin role).
 * Endpoint: DELETE /customers/:id
 */
export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

/**
 * Restore a deactivated customer (Admin role).
 * Endpoint: PATCH /customers/:id/restore
 */
export async function restoreCustomer(id: string): Promise<Customer> {
  const response = await api.patch<Customer>(`/customers/${id}/restore`);
  return response.data;
}
