import { useEffect, useState } from "react";
import { CORE_VERSION } from "@ideavault/core";
import { supabase } from "./lib/supabase";

function App() {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setError(error.message);
        } else {
          setStatus("ok");
        }
      })
      .catch((err: unknown) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>IdeaVault</h1>
      <p>Core version: {CORE_VERSION}</p>
      <p>
        Supabase: {status === "checking" && "conectando..."}
        {status === "ok" && "✓ conectado"}
        {status === "error" && `✗ error: ${error}`}
      </p>
    </div>
  );
}

export default App;
