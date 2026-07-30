/**
 * services/userService.ts
 * ────────────────────────
 * User profile data access layer — Phase 3 stub.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ApiResponse } from '@/types/api';

type Client = SupabaseClient<Database>;

export interface UserProfileInput {
  fullName: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export async function getUserProfile(_client: Client, _userId: string): Promise<ApiResponse<unknown>> {
  throw new Error('Phase 3: getUserProfile not yet implemented');
}

export async function updateUserProfile(_client: Client, _userId: string, _input: UserProfileInput): Promise<ApiResponse<unknown>> {
  throw new Error('Phase 3: updateUserProfile not yet implemented');
}

export async function deleteUserAccount(_client: Client, _userId: string): Promise<ApiResponse<void>> {
  throw new Error('Phase 3: deleteUserAccount not yet implemented');
}
