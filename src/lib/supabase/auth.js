// src/lib/supabase/auth.js
//
// Thin wrappers around Supabase Auth calls used by the login / reset
// password / logout UI. Kept in one place so error-message handling stays
// consistent across the app.
"use client";
import { createClient } from "./client";

export async function signInWithPassword(email, password) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { user: null, error: mapAuthError(error) };
  return { user: data.user, error: null };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(email) {
  const supabase = createClient();
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
  if (error) return { error: mapAuthError(error) };
  return { error: null };
}

export async function updatePassword(newPassword) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: mapAuthError(error) };
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function mapAuthError(error) {
  const msg = error?.message || "";
  if (msg.includes("Invalid login credentials")) return "Email or password is incorrect.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("For security purposes")) return "Too many attempts. Please wait a moment and try again.";
  return msg || "Something went wrong. Please try again.";
}
