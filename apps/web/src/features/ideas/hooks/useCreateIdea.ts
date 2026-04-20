import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NewIdeaInputSchema, type NewIdeaInput } from "@ideavault/core";
import { supabase } from "../../../lib/supabase";
import type { IdeaRow } from "./useIdeas";

export function useCreateIdea(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewIdeaInput): Promise<IdeaRow> => {
      const parsed = NewIdeaInputSchema.parse(input);
      const { data, error } = await supabase
        .from("ideas")
        .insert({
          user_id: userId,
          title: parsed.title,
          description: parsed.description ?? null,
          category: parsed.category,
          stage: parsed.stage,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ideas", userId] });
    },
  });
}
