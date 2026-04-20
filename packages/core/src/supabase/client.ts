import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ClientEnv } from "../env.js";
import type { Database } from "./database.types.js";

export type IdeaVaultSupabaseClient = SupabaseClient<Database>;

/**
 * Factory para crear el cliente Supabase tipado.
 * Cada app (web, mobile) lo llama una vez en su bootstrap con sus env vars.
 */
export function createIdeaVaultClient(env: ClientEnv): IdeaVaultSupabaseClient {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
