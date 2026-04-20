import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IdeaStageSchema, IdeaDevelopmentSchema, UpdateIdeaInputSchema } from "@ideavault/core";
import type { IdeaStage } from "@ideavault/core";
import { useAuth } from "../../auth/hooks/useAuth";
import { useIdea } from "../hooks/useIdea";
import { useUpdateIdea } from "../hooks/useUpdateIdea";
import { useDeleteIdea } from "../hooks/useDeleteIdea";
import { useDevelopIdea } from "../hooks/useDevelopIdea";
import { StagePill } from "../components/StagePill";
import { DevBlock } from "../components/DevBlock";
import styles from "./IdeaDetailPage.module.css";

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: idea, isLoading, error } = useIdea(id!);
  const updateIdea = useUpdateIdea(user!.id);
  const deleteIdea = useDeleteIdea(user!.id);
  const developIdea = useDevelopIdea();

  const [aiError, setAiError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number | null } | null>(null);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStage, setEditStage] = useState<IdeaStage>("seed");
  const [editError, setEditError] = useState<string | null>(null);

  if (isLoading) {
    return <div className={styles.loadingState}>Cargando idea...</div>;
  }

  if (error || !idea) {
    return (
      <div className={styles.errorState}>
        No se pudo cargar la idea. <button onClick={() => navigate("/")}>Volver</button>
      </div>
    );
  }

  const stage = IdeaStageSchema.safeParse(idea.stage).success
    ? (idea.stage as IdeaStage)
    : ("seed" as const);

  const devData = idea.development ? IdeaDevelopmentSchema.safeParse(idea.development) : null;

  function startEdit() {
    setEditTitle(idea!.title);
    setEditDescription(idea!.description ?? "");
    setEditCategory(idea!.category);
    setEditStage(stage);
    setEditError(null);
    setEditing(true);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError(null);

    const result = UpdateIdeaInputSchema.safeParse({
      title: editTitle,
      description: editDescription || null,
      category: editCategory,
      stage: editStage,
    });

    if (!result.success) {
      setEditError(result.error.issues[0]?.message ?? "Error de validación");
      return;
    }

    try {
      await updateIdea.mutateAsync({ id: idea!.id, input: result.data });
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta idea?")) return;
    await deleteIdea.mutateAsync(idea!.id);
    navigate("/");
  }

  if (editing) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backButton} onClick={() => setEditing(false)}>
              ← Cancelar
            </button>
          </div>
        </header>

        <form className={styles.editForm} onSubmit={handleSave}>
          {editError && <div className={styles.aiError}>{editError}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-title">
              Título
            </label>
            <input
              id="edit-title"
              className={styles.input}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-description">
              Descripción
            </label>
            <textarea
              id="edit-description"
              className={styles.textarea}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              maxLength={5000}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-category">
              Categoría
            </label>
            <input
              id="edit-category"
              className={styles.input}
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-stage">
              Etapa
            </label>
            <select
              id="edit-stage"
              className={styles.select}
              value={editStage}
              onChange={(e) => setEditStage(e.target.value as IdeaStage)}
            >
              <option value="seed">Semilla</option>
              <option value="growing">Creciendo</option>
              <option value="ready">Lista</option>
            </select>
          </div>

          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.cancelEditButton}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={updateIdea.isPending}>
              {updateIdea.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            ← Volver
          </button>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.editButton} onClick={startEdit}>
            Editar
          </button>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={deleteIdea.isPending}
          >
            Eliminar
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{idea.title}</h1>
          <StagePill stage={stage} />
        </div>

        <div className={styles.meta}>
          <span className={styles.category}>{idea.category}</span>
        </div>

        {idea.description && <p className={styles.description}>{idea.description}</p>}

        <div className={styles.aiSection}>
          <span className={styles.aiTitle}>Desarrollo con IA</span>

          {devData?.success && <DevBlock dev={devData.data} />}

          <button
            className={styles.developButton}
            disabled={developIdea.isPending}
            onClick={() => {
              setAiError(null);
              developIdea.mutate(idea.id, {
                onSuccess: (data) => {
                  if (data.usage.limit !== null) {
                    setUsageInfo({ used: data.usage.used, limit: data.usage.limit });
                  }
                },
                onError: (err) => {
                  const msg = (err as { message?: string }).message ?? "";
                  if (msg.includes("rate_limit") || msg.includes("429")) {
                    setAiError(
                      "Usaste tu trial de 20 ideas desarrolladas. Próximamente vas a poder traer tu propia API key o subscribirte para seguir usando.",
                    );
                  } else if (msg.includes("idea_not_found") || msg.includes("404")) {
                    setAiError("No se encontró la idea.");
                  } else if (
                    msg.includes("anthropic_") ||
                    msg.includes("invalid_model_output") ||
                    msg.includes("502")
                  ) {
                    setAiError(
                      "Algo salió mal al desarrollar la idea. Intentá de nuevo en un momento.",
                    );
                  } else {
                    setAiError("Error inesperado. Intentá de nuevo.");
                  }
                },
              });
            }}
          >
            {developIdea.isPending ? "Procesando..." : "✦ Desarrollar con IA"}
          </button>

          {aiError && <p className={styles.aiError}>{aiError}</p>}
          {usageInfo && usageInfo.limit !== null && (
            <p className={styles.usageInfo}>
              {usageInfo.used} de {usageInfo.limit} usos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
