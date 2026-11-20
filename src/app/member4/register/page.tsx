"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthInput } from "../components/AuthInput";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { registerUser } from "../../../../member4/services/api";
import { getPasswordGuidance, isValidEmail, isValidPhone } from "../../../../member4/utils/validation";
import "../Member4.module.css";

interface RegisterValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterValues>({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const submissionInProgress = useRef(false);

  function update(name: keyof RegisterValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    const guidance = getPasswordGuidance(values.password);
    if (!values.fullName.trim() || !isValidEmail(values.email) || !isValidPhone(values.phone)) {
      setError("Enter a valid name, email address, and phone number.");
      return;
    }
    if (guidance.length > 0) {
      setError(`Password needs ${guidance.join(", ")}.`);
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    submissionInProgress.current = true;
    setLoading(true);
    try {
      const result = await registerUser({
        fullName: values.fullName.trim(), email: values.email.trim(),
        phone: values.phone.trim(), password: values.password,
      });
      if (!result.confirmationRequired) {
        router.replace("/home");
        return;
      }
      setSuccess("Your account request was received. Check your email for a confirmation link before signing in.");
      setValues({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Registration could not be completed.");
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="WELCOME ABOARD"
      title="Create your account"
      description="Set up your CrowdFlow profile for a simpler, smarter commute."
      footer={<>Already have an account? <Link href="/member4/login">Sign in</Link></>}
    >
      <form className={"form"} onSubmit={submit} noValidate>
        <AuthInput id="fullName" label="Full name" value={values.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Enter your full name" autoComplete="name" required />
        <AuthInput id="email" label="Email address" value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <AuthInput id="phone" label="Phone number" value={values.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" required />
        <PasswordInput id="password" label="Password" value={values.password} onChange={(e) => update("password", e.target.value)} placeholder="Create a password" autoComplete="new-password" required />
        <p className={"hint"}>
          Use 8+ characters with an uppercase letter and a number.
          {values.password && getPasswordGuidance(values.password).length === 0 && <span className={"hintGood"}> Password strength looks good.</span>}
        </p>
        <PasswordInput id="confirmPassword" label="Confirm password" value={values.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" required />
        {error && <p className={"formError"} role="alert">{error}</p>}
        {success && <p className={"successMessage"} role="status">{success}</p>}
        <PrimaryButton type="submit" loading={loading}>Create account</PrimaryButton>
      </form>
    </AuthLayout>
  );
}
