import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSignOut } from "../../auth/hooks/useSignOut";
import { useIdeas, type IdeasFilter } from "../hooks/useIdeas";
import { IdeaCard } from "../components/IdeaCard";
import { Sidebar } from "../components/Sidebar";
import styles from "./IdeasListPage.module.css";

export function IdeasListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [filter, setFilter] = useState<IdeasFilter>({ stage: "all" });

  const { data: ideas, isLoading, error } = useIdeas(user!.id, filter);

  return (
    <div className={styles.root}>
      <Sidebar filter={filter} onFilterChange={setFilter} />

      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>IdeaVault</h1>
          <div className={styles.headerRight}>
            <button className={styles.newButton} onClick={() => navigate("/ideas/new")}>
              + Nueva idea
            </button>
            <button
              className={styles.signOutButton}
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              Salir
            </button>
          </div>
        </header>

        <div className={styles.list}>
          {isLoading && (
            <div className={styles.empty}>
              <p>Cargando ideas...</p>
            </div>
          )}

          {error && <div className={styles.error}>Error al cargar ideas: {error.message}</div>}

          {!isLoading && !error && ideas?.length === 0 && (
            <div className={styles.empty}>
              <h2 className={styles.emptyTitle}>No hay ideas todavía</h2>
              <p>Empezá capturando tu primera idea.</p>
              <button className={styles.newButton} onClick={() => navigate("/ideas/new")}>
                + Nueva idea
              </button>
            </div>
          )}

          {ideas?.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onClick={() => navigate(`/ideas/${idea.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
