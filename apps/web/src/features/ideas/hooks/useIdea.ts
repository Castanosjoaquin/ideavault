import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import type { IdeaRow } from "./useIdeas";

export function useIdea(ideaId: string) {
  return useQuery({
    queryKey: ["idea", ideaId] as const,
    queryFn: async (): Promise<IdeaRow> => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
