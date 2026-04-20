import { z } from "zod";

export const IdeaStageSchema = z.enum(["seed", "growing", "ready"]);
export type IdeaStage = z.infer<typeof IdeaStageSchema>;

export const IdeaDevelopmentSchema = z.object({
  problema: z.string(),
  propuesta: z.string(),
  pasos: z.array(z.string()),
  desafios: z.array(z.string()),
  recursos: z.array(z.string()),
  proxima_accion: z.string(),
});
export type IdeaDevelopment = z.infer<typeof IdeaDevelopmentSchema>;

export const IdeaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable(),
  category: z.string(),
  stage: IdeaStageSchema,
  development: IdeaDevelopmentSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type Idea = z.infer<typeof IdeaSchema>;

export const NewIdeaInputSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200),
  description: z.string().max(5000).optional(),
  category: z.string().default("General"),
  stage: IdeaStageSchema.default("seed"),
});
export type NewIdeaInput = z.infer<typeof NewIdeaInputSchema>;

export const UpdateIdeaInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  category: z.string().optional(),
  stage: IdeaStageSchema.optional(),
  development: IdeaDevelopmentSchema.nullable().optional(),
});
export type UpdateIdeaInput = z.infer<typeof UpdateIdeaInputSchema>;
