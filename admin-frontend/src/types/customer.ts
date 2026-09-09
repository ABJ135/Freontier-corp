export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders?: number;
  };
}

export interface CreateCustomerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export function getCustomerName(customer?: Partial<Customer> | null): string {
  if (!customer) return "Unnamed Customer";
  if (customer.name && customer.name.trim() !== "") return customer.name;
  if (customer.email) return customer.email.split("@")[0];
  return "Unnamed Customer";
}

export function getCustomerPhone(customer?: Partial<Customer> | null): string | null {
  if (!customer) return null;
  return customer.phone ?? null;
}
