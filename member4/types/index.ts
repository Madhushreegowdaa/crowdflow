export type PassStatus = "active" | "expired" | "pending";

export const PASS_TYPE_OPTIONS = [
  "Daily Pass",
  "Weekly Pass",
  "Monthly Pass",
  "Student Pass",
] as const;

export type PassType = (typeof PASS_TYPE_OPTIONS)[number];
export type PassRequestStatus = "pending" | "approved" | "rejected";

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegistrationResult {
  signedIn: boolean;
  confirmationRequired: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  joinedAt: string;
}

export interface DigitalPass {
  id: string;
  passengerName: string;
  type: string;
  validFrom: string;
  validUntil: string;
  status: PassStatus;
  issuedAt: string;
  routeCategory?: string;
}

export interface PassRequest {
  id: string;
  passType: string;
  routeCategory: string;
  status: PassRequestStatus;
  createdAt: string;
}

export interface ServiceError {
  message: string;
  code?: string;
}
