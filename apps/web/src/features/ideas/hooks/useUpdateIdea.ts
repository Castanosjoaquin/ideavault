import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateIdeaInputSchema, type UpdateIdeaInput } from "@ideavault/core";
import { supabase } from "../../../lib/supabase";
import type { IdeaRow } from "./useIdeas";

export function useUpdateIdea(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateIdeaInput }): Promise<IdeaRow> => {
      const parsed = UpdateIdeaInputSchema.parse(input);
      const { data, error } = await supabase
        .from("ideas")
        .update(parsed)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["ideas", userId] });
      void queryClient.invalidateQueries({ queryKey: ["idea", data.id] });
    },
  });
}
