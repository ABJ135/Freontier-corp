export interface ShippingPartner {
  id: string;
  name: string;
  code: string;
  trackingUrlTemplate: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingPartnerPayload {
  name: string;
  code: string;
  trackingUrlTemplate?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  isActive?: boolean;
}

export type UpdateShippingPartnerPayload = Partial<CreateShippingPartnerPayload>;
