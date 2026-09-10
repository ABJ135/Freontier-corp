export interface StoreSettings {
  id: string;
  storeName: string;
  supportEmail: string;
  currency: string;
  logoUrl: string | null;
  updatedAt?: string;
}

export interface UpdateStoreSettingsPayload {
  storeName?: string;
  supportEmail?: string;
  currency?: string;
  logoUrl?: string;
}
