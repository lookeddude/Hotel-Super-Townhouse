/**
 * lib/supabase/auth.ts
 * ──────────────────────
 * Production Supabase Auth helpers — Phase 4 implementation.
 *
 * Supported flows:
 * - Login (email + password + remember me)
 * - Register (email + password → profile + customer role)
 * - Forgot Password / Reset Password
 * - Email Verification
 * - Get Session / User / Role
 * - Sign Out
 * - Role resolution from user_roles table (NOT app_metadata)
 */

import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'customer'
  | 'reception' | 'manager' | 'admin' | 'super_admin'
  | 'housekeeping' | 'maintenance' | 'chef' | 'security';

export type AdminRole = 'reception' | 'manager' | 'admin' | 'super_admin'
  | 'housekeeping' | 'maintenance' | 'chef' | 'security';

export const ADMIN_ROLES: AdminRole[] = [
  'super_admin', 'admin', 'manager', 'reception',
  'housekeeping', 'maintenance', 'chef', 'security',
];

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export type AuthResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

type Client = SupabaseClient<Database>;

// ─── Session ─────────────────────────────────────────────────────────────────

export async function getSession(client: Client): Promise<Session | null> {
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

export async function getCurrentUser(client: Client): Promise<User | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export async function isAuthenticated(client: Client): Promise<boolean> {
  const user = await getCurrentUser(client);
  return user !== null;
}

// ─── Role Resolution ──────────────────────────────────────────────────────────

/**
 * Resolve the user's primary role from the user_roles join table.
 * Priority: super_admin > admin > manager > reception > customer
 */
export async function getUserRole(client: Client, userId?: string): Promise<UserRole> {
  let uid = userId;
  if (!uid) {
    const user = await getCurrentUser(client);
    if (!user) return 'customer';
    uid = user.id;
  }

  const { data, error } = await client
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', uid)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

  if (error || !data || data.length === 0) return 'customer';

  const roleNames = data
    .map((r) => (r.roles as { name: string } | null)?.name)
    .filter(Boolean) as string[];

  // Priority: super_admin > admin > manager > reception > housekeeping > maintenance > chef > security > customer
  const priority: UserRole[] = [
    'super_admin', 'admin', 'manager', 'reception',
    'housekeeping', 'maintenance', 'chef', 'security',
    'customer',
  ];
  for (const role of priority) {
    if (roleNames.includes(role)) return role;
  }
  return 'customer';
}

export async function getAuthUser(client: Client): Promise<AuthUser | null> {
  const user = await getCurrentUser(client);
  if (!user) return null;

  const [profileResult, role] = await Promise.all([
    client
      .from('profiles')
      .select('full_name, avatar_url, email_verified')
      .eq('id', user.id)
      .single(),
    getUserRole(client, user.id),
  ]);

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profileResult.data?.full_name ?? null,
    avatarUrl: profileResult.data?.avatar_url ?? null,
    role,
    emailVerified: profileResult.data?.email_verified ?? false,
  };
}

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role as AdminRole);
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signInWithEmail(
  client: Client,
  email: string,
  password: string
): Promise<AuthResult<{ role: UserRole; userId: string }>> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Invalid email or password. Please try again.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        success: false,
        error: 'Please verify your email address before signing in. Check your inbox.',
      };
    }
    if (error.message.includes('Too many requests')) {
      return { success: false, error: 'Too many login attempts. Please wait a few minutes.' };
    }
    return { success: false, error: error.message };
  }

  if (!data.user) return { success: false, error: 'Authentication failed. Please try again.' };

  // Update last_login_at
  await client
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id);

  const role = await getUserRole(client, data.user.id);
  return { success: true, data: { role, userId: data.user.id } };
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  client: Client,
  params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    redirectTo: string;
  }
): Promise<AuthResult<{ emailConfirmationRequired: boolean }>> {
  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        phone: params.phone,
      },
      emailRedirectTo: params.redirectTo,
    },
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
      };
    }
    if (error.message.includes('Password should be')) {
      return { success: false, error: 'Password is too weak. Please choose a stronger password.' };
    }
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Registration failed. Please try again.' };
  }

  // If user is already confirmed (e.g. email confirmations disabled in Supabase)
  if (data.user && data.session) {
    await ensureCustomerRole(client, data.user.id);
  }

  const emailConfirmationRequired = !data.session;
  return { success: true, data: { emailConfirmationRequired } };
}

/**
 * Ensure the user has a customer role assigned.
 * Called after signup and after email confirmation callback.
 */
export async function ensureCustomerRole(client: Client, userId: string): Promise<void> {
  // Check if user already has a role
  const { data: existing } = await client
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existing && existing.length > 0) return;

  // Get the customer role id
  const { data: role } = await client
    .from('roles')
    .select('id')
    .eq('name', 'customer')
    .single();

  if (!role) return;

  await client.from('user_roles').insert({
    user_id: userId,
    role_id: role.id,
  });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordReset(
  client: Client,
  email: string,
  redirectTo: string
): Promise<AuthResult<void>> {
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    // Don't reveal whether email exists (security)
    console.error('Password reset error:', error.message);
  }

  // Always return success to prevent email enumeration
  return { success: true, data: undefined };
}

export async function updatePassword(
  client: Client,
  newPassword: string
): Promise<AuthResult<void>> {
  const { error } = await client.auth.updateUser({ password: newPassword });

  if (error) {
    return { success: false, error: 'Failed to update password. Please try again.' };
  }
  return { success: true, data: undefined };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(client: Client): Promise<void> {
  await client.auth.signOut();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(
  client: Client,
  userId: string,
  updates: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }
): Promise<AuthResult<void>> {
  const { error } = await client
    .from('profiles')
    .update({
      full_name: updates.fullName,
      phone: updates.phone,
      date_of_birth: updates.dateOfBirth || null,
      gender: (updates.gender as Database['public']['Enums']['gender']) || null,
      nationality: updates.nationality || null,
      address_line1: updates.addressLine1 || null,
      address_line2: updates.addressLine2 || null,
      city: updates.city || null,
      state: updates.state || null,
      postal_code: updates.postalCode || null,
      country: updates.country || null,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: 'Failed to update profile. Please try again.' };
  }
  return { success: true, data: undefined };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function signInWithGoogle(
  client: Client,
  redirectTo: string
): Promise<AuthResult<void>> {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) {
    return { success: false, error: 'Google sign-in failed. Please try again.' };
  }
  return { success: true, data: undefined };
}
