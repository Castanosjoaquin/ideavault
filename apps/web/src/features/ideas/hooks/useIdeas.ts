import { useQuery } from "@tanstack/react-query";
import type { IdeaStage } from "@ideavault/core";
import { supabase } from "../../../lib/supabase";
import type { Database } from "@ideavault/core";

export type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"];

export type IdeasFilter = {
  stage?: IdeaStage | "all";
  search?: string;
};

export function useIdeas(userId: string, filter?: IdeasFilter) {
  return useQuery({
    queryKey: ["ideas", userId, filter] as const,
    queryFn: async (): Promise<IdeaRow[]> => {
      let query = supabase
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (filter?.stage && filter.stage !== "all") {
        query = query.eq("stage", filter.stage);
      }

      if (filter?.search) {
        query = query.or(`title.ilike.%${filter.search}%,category.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
