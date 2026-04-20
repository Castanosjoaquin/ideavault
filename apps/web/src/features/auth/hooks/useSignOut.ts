import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () =>
      supabase.auth.signOut().then(({ error }) => {
        if (error) throw error;
      }),
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}
