import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";

type DevelopResponse = {
  development: {
    problema: string;
    propuesta: string;
    pasos: string[];
    desafios: string[];
    recursos: string[];
    proxima_accion: string;
  };
  usage: {
    used: number;
    limit: number | null;
    tier: "free_trial" | "byok" | "paid";
    remaining: number | null;
  };
};

export function useDevelopIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ideaId: string): Promise<DevelopResponse> => {
      const { data, error } = await supabase.functions.invoke<DevelopResponse>("develop-idea", {
        body: { ideaId },
      });
      if (error) throw error;
      if (!data) throw new Error("empty_response");
      return data;
    },
    onSuccess: (_data, ideaId) => {
      qc.invalidateQueries({ queryKey: ["idea", ideaId] });
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
}
