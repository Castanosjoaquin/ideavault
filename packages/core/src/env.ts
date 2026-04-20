import { z } from "zod";

/**
 * Schema de env vars de Supabase que cliente y mobile necesitan.
 * Se valida con `parseClientEnv()` en el entry point de cada app.
 */
export const clientEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Valida y parsea las env vars del cliente.
 * Lanza si faltan o son inválidas — queremos fallar temprano, no en runtime profundo.
 */
export function parseClientEnv(raw: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Env vars de Supabase inválidas o faltantes:\n${issues}`);
  }
  return result.data;
}
