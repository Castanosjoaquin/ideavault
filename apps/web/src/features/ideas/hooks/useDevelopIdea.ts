import { useMutation } from "@tanstack/react-query";

export function useDevelopIdea() {
  return useMutation({
    mutationFn: async (_ideaId: string): Promise<never> => {
      throw new Error("Edge Function develop-idea no implementada todavía (Prompt C)");
    },
  });
}
