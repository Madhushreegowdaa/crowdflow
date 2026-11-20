"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";
import styles from "../styles/AdminAuth.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminLoginForm() {
  const [email,setEmail] = useState(""); const [password,setPassword] = useState(""); const [show,setShow] = useState(false); const [error,setError] = useState(""); const [loading,setLoading] = useState(false); const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if(lock.current)return; if(!emailPattern.test(email.trim())||!password){setError("Enter a valid email address and password.");return;} lock.current=true;setLoading(true);setError("");try{const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password})});const body=await response.json() as {message?:string};if(!response.ok)throw new Error(body.message||"Admin sign in could not be completed.");window.location.assign("/admin/dashboard");}catch(e){setError(e instanceof Error?e.message:"Admin sign in could not be completed.");lock.current=false;setLoading(false);}}
  return <form className={styles.form} onSubmit={submit} noValidate>
    <div className={styles.field}><label htmlFor="admin-email">Email address</label><input className={styles.input} id="admin-email" type="email" autoComplete="username" placeholder="name@crowdflow.com" value={email} onChange={e=>{setEmail(e.target.value);setError("")}} required /></div>
    <div className={styles.field}><label htmlFor="admin-password">Password</label><div className={styles.inputWrap}><input className={`${styles.input} ${styles.hasToggle}`} id="admin-password" type={show?"text":"password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>{setPassword(e.target.value);setError("")}} required /><button className={styles.toggle} type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"} aria-pressed={show}>{show?"Hide":"Show"}</button></div></div>
    {error&&<p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}
    <button className={styles.button} disabled={loading} type="submit"><span className={styles.buttonContent}>{loading&&<span className={styles.spinner} aria-hidden="true"/>}{loading?"Signing in…":"Login"}</span>{!loading&&<span aria-hidden="true">→</span>}</button>
  </form>;
}

export function AdminRegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [invite, setInvite] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const lock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    setSuccess("");

    if (name.trim().length < 3 || !emailPattern.test(email.trim()) || !phone.trim() || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !invite.trim()) {
      setError("Enter a full name with at least 3 characters, a valid email, a phone number, an invitation code, and a password with 8+ characters, one uppercase letter, and one number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    lock.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim(), email: email.trim(), phone: phone.trim(), password, invitationCode: invite }),
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message || "Admin registration could not be completed.");

      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        if (signInError.code === "email_not_confirmed") {
          setSuccess("Your account was created, but email confirmation is required. Check your inbox, verify your email, then sign in.");
          setName(""); setEmail(""); setPhone(""); setPassword(""); setConfirm(""); setInvite("");
          return;
        }
        throw new Error(signInError.message || "Your account was created, but automatic sign in failed. Try signing in.");
      }

      // Verify role claims against the authenticated user returned by Supabase before redirecting.
      const { data: verified, error: verifyError } = await supabase.auth.getUser();
      if (verifyError || !verified.user || data.user.app_metadata?.role !== "admin" || verified.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Your account was created, but administrator access could not be verified. Contact your administrator.");
      }

      window.location.assign("/admin/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Admin registration could not be completed.");
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }
  return <form className={styles.form} onSubmit={submit} noValidate>
    <div className={styles.field}><label htmlFor="admin-name">Full name</label><input className={styles.input} id="admin-name" autoComplete="name" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)} required minLength={3} /></div>
    <div className={styles.field}><label htmlFor="admin-register-email">Email address</label><input className={styles.input} id="admin-register-email" type="email" autoComplete="email" placeholder="name@crowdflow.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
    <div className={styles.field}><label htmlFor="admin-phone">Phone number</label><input className={styles.input} id="admin-phone" type="tel" autoComplete="tel" placeholder="Enter your phone number" value={phone} onChange={e=>setPhone(e.target.value)} required /></div>
    <div className={styles.field}><label htmlFor="admin-register-password">Password</label><div className={styles.inputWrap}><input className={`${styles.input} ${styles.hasToggle}`} id="admin-register-password" type={show?"text":"password"} autoComplete="new-password" placeholder="Create a strong password" value={password} onChange={e=>setPassword(e.target.value)} required /><button className={styles.toggle} type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"} aria-pressed={show}>{show?"Hide":"Show"}</button></div><small className={styles.hint}>Use 8+ characters with an uppercase letter and a number.</small></div>
    <div className={styles.field}><label htmlFor="admin-confirm">Confirm password</label><input className={styles.input} id="admin-confirm" type={show?"text":"password"} autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={e=>setConfirm(e.target.value)} required /></div>
    <div className={styles.field}><label htmlFor="admin-invite">Admin invitation code</label><input className={styles.input} id="admin-invite" type="password" autoComplete="off" placeholder="Enter your invitation code" value={invite} onChange={e=>setInvite(e.target.value)} required /></div>
    {error&&<p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}{success&&<p className={`${styles.message} ${styles.success}`} role="status">{success} <Link href="/admin/login">Go to Admin Login</Link></p>}
    <button className={styles.button} disabled={loading} type="submit"><span className={styles.buttonContent}>{loading&&<span className={styles.spinner} aria-hidden="true"/>}{loading?"Creating account…":"Register Admin"}</span>{!loading&&<span aria-hidden="true">→</span>}</button>
  </form>;
}
