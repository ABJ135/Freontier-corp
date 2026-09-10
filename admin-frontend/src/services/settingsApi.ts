import api from "../lib/api";
import type { StoreSettings, UpdateStoreSettingsPayload } from "../types/settings";

/**
 * Fetch the current store configuration.
 * Endpoint: GET /settings
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  const response = await api.get<StoreSettings>("/settings");
  return response.data;
}

/**
 * Partially update the store configuration.
 * Endpoint: PATCH /settings
 */
export async function updateStoreSettings(
  data: UpdateStoreSettingsPayload,
): Promise<StoreSettings> {
  const response = await api.patch<StoreSettings>("/settings", data);
  return response.data;
}
