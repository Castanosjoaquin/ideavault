export const CORE_VERSION = "0.0.0";

export { parseClientEnv, clientEnvSchema } from "./env.js";
export type { ClientEnv } from "./env.js";

export { createIdeaVaultClient } from "./supabase/index.js";
export type { IdeaVaultSupabaseClient, Database, Json } from "./supabase/index.js";

export {
  IdeaStageSchema,
  IdeaDevelopmentSchema,
  IdeaSchema,
  NewIdeaInputSchema,
  UpdateIdeaInputSchema,
  EmailSchema,
  MagicLinkRequestSchema,
} from "./schemas/index.js";
export type {
  IdeaStage,
  IdeaDevelopment,
  Idea,
  NewIdeaInput,
  UpdateIdeaInput,
  MagicLinkRequest,
} from "./schemas/index.js";
