import { z } from "zod";

export const EmailSchema = z.string().email("Email inválido");

export const MagicLinkRequestSchema = z.object({
  email: EmailSchema,
});
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
