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
 * Partially update the store configuration (JSON fields: name, email, currency).
 * Endpoint: PATCH /settings
 */
export async function updateStoreSettings(
  data: UpdateStoreSettingsPayload,
): Promise<StoreSettings> {
  const response = await api.patch<StoreSettings>("/settings", data);
  return response.data;
}

/**
 * Upload a new store logo via Cloudinary.
 * Sends multipart/form-data with field name "file".
 * The backend deletes the old logo and returns the updated settings.
 * Endpoint: POST /settings/logo
 */
export async function uploadStoreLogo(file: File): Promise<StoreSettings> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<StoreSettings>("/settings/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

