"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthInput } from "../components/AuthInput";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { loginUser } from "../../../../member4/services/api";
import { isValidEmail } from "../../../../member4/utils/validation";
import "../Member4.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submissionInProgress = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    if (!isValidEmail(email) || !password) {
      setError("Enter a valid email address and password.");
      return;
    }
    submissionInProgress.current = true;
    setLoading(true);
    setError("");
    try {
      await loginUser({ email: email.trim(), password, rememberMe });
      router.replace("/home");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login could not be completed.");
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Sign in to CrowdFlow"
      description="Access your profile, passes, and everyday travel information."
      footer={<>New to CrowdFlow? <Link href="/member4/register">Create an account</Link></>}
    >
      <form className={"form"} onSubmit={submit} noValidate>
        <AuthInput id="email" label="Email address" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" autoComplete="email" required />
        <PasswordInput id="password" label="Password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" autoComplete="current-password" required />
        <div className={"inlineRow"}>
          <label className={"checkLabel"}><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me</label>
          <a className={"textLink"} href="#forgot-password">Forgot password?</a>
        </div>
        {error && <p className={"formError"} role="alert">{error}</p>}
        <PrimaryButton type="submit" loading={loading}>Sign in</PrimaryButton>
      </form>
    </AuthLayout>
  );
}
