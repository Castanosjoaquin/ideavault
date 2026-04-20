import { useState, type FormEvent } from "react";
import { MagicLinkRequestSchema } from "@ideavault/core";
import { supabase } from "../../../lib/supabase";
import styles from "./AuthForm.module.css";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const result = MagicLinkRequestSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Email inválido");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: result.data.email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.logo}>IdeaVault</h1>
        <p className={styles.tagline}>Capturá y desarrollá tus ideas con IA</p>

        {sent ? (
          <div className={styles.success}>
            <p>Te enviamos un link a</p>
            <p className={styles.successEmail}>{email}</p>
            <p>Revisá tu bandeja de entrada.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                placeholder="vos@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar magic link"}
            </button>
            {/* TODO: OAuth Google en prompt B */}
          </form>
        )}
      </div>
    </div>
  );
}
