import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./AuthCallbackPage.module.css";

export function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    timerRef.current = setTimeout(() => setTimedOut(true), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (timedOut && !user) {
    return (
      <div className={styles.root}>
        <p className={styles.error}>
          No se pudo verificar la sesión. El link puede haber expirado.{" "}
          <a href="/login">Intentar de nuevo</a>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.spinner} aria-label="Verificando sesión..." />
      <p className={styles.text}>Verificando sesión...</p>
    </div>
  );
}
