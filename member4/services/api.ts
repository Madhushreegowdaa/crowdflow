import { createClient } from "../../src/lib/supabase/client";
import type {
  LoginRequest,
  RegisterRequest,
  RegistrationResult,
  UserProfile,
} from "../types";

function getAuthenticationError(error: { code?: string; message: string }): Error {
  if (error.code === "email_not_confirmed") {
    return new Error("Please confirm your email address before signing in. Check your inbox for the confirmation link.");
  }

  if (error.code === "invalid_credentials") {
    return new Error("Email or password is incorrect. Check your details and try again.");
  }

  if (error.code === "user_already_exists") {
    return new Error("An account with this email may already exist. Try signing in or resetting your password.");
  }

  if (/password/i.test(error.message) && /length|least/i.test(error.message)) {
    return new Error("Your password does not meet the requirements. Use at least 8 characters, including an uppercase letter and a number.");
  }

  return new Error(error.message || "Authentication could not be completed. Please try again.");
}

type EndpointKey =
  | "register"
  | "login"
  | "profile"
  | "updateProfile";

const endpointEnvironmentKeys: Record<EndpointKey, string> = {
  register: "NEXT_PUBLIC_CROWDFLOW_REGISTER_PATH",
  login: "NEXT_PUBLIC_CROWDFLOW_LOGIN_PATH",
  profile: "NEXT_PUBLIC_CROWDFLOW_PROFILE_PATH",
  updateProfile: "NEXT_PUBLIC_CROWDFLOW_UPDATE_PROFILE_PATH",
};

function getEndpoint(key: EndpointKey): string {
  const baseUrl = process.env.NEXT_PUBLIC_CROWDFLOW_API_BASE_URL;
  const path = process.env[endpointEnvironmentKeys[key]];

  if (!baseUrl || !path) {
    throw new Error(
      "CrowdFlow services are not connected yet. Please try again after the shared backend is configured.",
    );
  }

  try {
    return new URL(path, baseUrl).toString();
  } catch {
    throw new Error(
      "CrowdFlow services are unavailable because the API configuration is invalid.",
    );
  }
}

async function request<T>(
  key: EndpointKey,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(getEndpoint(key), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `The request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the HTTP error when the backend does not return JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function registerUser(
  payload: RegisterRequest,
): Promise<RegistrationResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName.trim(),
        phone: payload.phone.trim(),
      },
    },
  });

  if (error) throw getAuthenticationError(error);

  return {
    signedIn: data.session !== null,
    confirmationRequired: data.session === null,
  };
}

export async function loginUser(payload: LoginRequest): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email.trim(),
    password: payload.password,
  });

  if (error) throw getAuthenticationError(error);
}

export function getUserProfile(): Promise<UserProfile> {
  return request<UserProfile>("profile");
}

export function updateUserProfile(
  payload: Pick<UserProfile, "fullName" | "phone">,
): Promise<UserProfile> {
  return request<UserProfile>("updateProfile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

