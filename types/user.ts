/** User / Guest entity types */
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
  address?: UserAddress;
}

export type UserRole = 'guest' | 'admin' | 'superadmin';

export interface UserPreferences {
  newsletter: boolean;
  smsAlerts: boolean;
  emailAlerts: boolean;
}

export interface UserAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface UserProfileFormData {
  name: string;
  phone?: string;
  address?: Partial<UserAddress>;
  preferences?: Partial<UserPreferences>;
}
