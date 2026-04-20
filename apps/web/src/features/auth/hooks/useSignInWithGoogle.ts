import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useSignInWithGoogle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // Si no hay error, el browser redirige a Google. No toca volver acá.
  }

  return { signInWithGoogle, loading, error };
}
