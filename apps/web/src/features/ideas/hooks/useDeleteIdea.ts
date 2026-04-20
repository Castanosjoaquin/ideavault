import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";

export function useDeleteIdea(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ideaId: string): Promise<void> => {
      const { error } = await supabase
        .from("ideas")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", ideaId);
      if (error) throw error;
    },
    onSuccess: (_data, ideaId) => {
      void queryClient.invalidateQueries({ queryKey: ["ideas", userId] });
      void queryClient.removeQueries({ queryKey: ["idea", ideaId] });
    },
  });
}
