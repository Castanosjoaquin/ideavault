export const CORE_VERSION = "0.0.0";

export { parseClientEnv, clientEnvSchema } from "./env.js";
export type { ClientEnv } from "./env.js";

export { createIdeaVaultClient } from "./supabase/index.js";
export type { IdeaVaultSupabaseClient, Database } from "./supabase/index.js";
