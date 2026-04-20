import { createIdeaVaultClient, parseClientEnv } from "@ideavault/core";

const env = parseClientEnv({
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const supabase = createIdeaVaultClient(env);
