import api from "../lib/api";
import type {
  ShippingPartner,
  CreateShippingPartnerPayload,
  UpdateShippingPartnerPayload,
} from "../types/shippingPartner";

/**
 * Get all **active** shipping partners (public).
 * Endpoint: GET /shipping-partners
 */
export async function getShippingPartners(): Promise<ShippingPartner[]> {
  const response = await api.get<ShippingPartner[]>("/shipping-partners");
  return response.data;
}

/**
 * Get ALL shipping partners including inactive ones (admin view).
 * Roles: ADMIN, EMPLOYEE
 * Endpoint: GET /shipping-partners/all
 */
export async function getAllShippingPartners(): Promise<ShippingPartner[]> {
  const response = await api.get<ShippingPartner[]>("/shipping-partners/all");
  return response.data;
}

/**
 * Fetch a single shipping partner by ID.
 * Endpoint: GET /shipping-partners/:id
 */
export async function getShippingPartner(id: string): Promise<ShippingPartner> {
  const response = await api.get<ShippingPartner>(`/shipping-partners/${id}`);
  return response.data;
}

/**
 * Create a new shipping partner.
 * Role: ADMIN
 * Endpoint: POST /shipping-partners
 */
export async function createShippingPartner(
  data: CreateShippingPartnerPayload,
): Promise<ShippingPartner> {
  const response = await api.post<ShippingPartner>("/shipping-partners", data);
  return response.data;
}

/**
 * Update an existing shipping partner.
 * Role: ADMIN
 * Endpoint: PATCH /shipping-partners/:id
 */
export async function updateShippingPartner(
  id: string,
  data: UpdateShippingPartnerPayload,
): Promise<ShippingPartner> {
  const response = await api.patch<ShippingPartner>(
    `/shipping-partners/${id}`,
    data,
  );
  return response.data;
}

/**
 * Soft-delete (deactivate) a shipping partner.
 * Role: ADMIN
 * Endpoint: DELETE /shipping-partners/:id
 */
export async function deleteShippingPartner(id: string): Promise<void> {
  await api.delete(`/shipping-partners/${id}`);
}

/**
 * Restore a previously deactivated shipping partner.
 * Role: ADMIN
 * Endpoint: PATCH /shipping-partners/:id/restore
 */
export async function restoreShippingPartner(
  id: string,
): Promise<ShippingPartner> {
  const response = await api.patch<ShippingPartner>(
    `/shipping-partners/${id}/restore`,
  );
  return response.data;
}
