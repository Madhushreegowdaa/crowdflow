
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return /^\+?[0-9\s()-]{8,20}$/.test(value.trim());
}

export function getPasswordGuidance(value: string): string[] {
  const guidance: string[] = [];

  if (value.length < 8) {
    guidance.push("8+ characters");
  }

  if (!/[A-Z]/.test(value)) {
    guidance.push("an uppercase letter");
  }

  if (!/[0-9]/.test(value)) {
    guidance.push("a number");
  }

  return guidance;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function validateRegistration(data: RegisterFormData) {
  const errors: Record<string, string> = {};

  if (data.fullName.trim().length < 3) {
    errors.fullName = "Enter your full name.";
  }

  if (!isValidEmail(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isValidPhone(data.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  const passwordGuidance = getPasswordGuidance(data.password);

  if (passwordGuidance.length > 0) {
    errors.password =
      "Password requires " + passwordGuidance.join(", ") + ".";
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
