import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { NewIdeaInputSchema } from "@ideavault/core";
import type { IdeaStage } from "@ideavault/core";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateIdea } from "../hooks/useCreateIdea";
import styles from "./NewIdeaPage.module.css";

export function NewIdeaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createIdea = useCreateIdea(user!.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [stage, setStage] = useState<IdeaStage>("seed");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const result = NewIdeaInputSchema.safeParse({
      title,
      description: description || undefined,
      category,
      stage,
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Error de validación");
      return;
    }

    try {
      const idea = await createIdea.mutateAsync(result.data);
      navigate(`/ideas/${idea.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear la idea");
    }
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          ← Volver
        </button>
        <h1 className={styles.title}>Nueva idea</h1>
      </header>

      <div className={styles.content}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && <div className={styles.error}>{formError}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              Título *
            </label>
            <input
              id="title"
              className={styles.input}
              type="text"
              placeholder="¿Cuál es tu idea?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              placeholder="Describila brevemente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="category">
              Categoría
            </label>
            <input
              id="category"
              className={styles.input}
              type="text"
              placeholder="Ej: Producto, Negocio, Arte..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="stage">
              Etapa
            </label>
            <select
              id="stage"
              className={styles.select}
              value={stage}
              onChange={(e) => setStage(e.target.value as IdeaStage)}
            >
              <option value="seed">Semilla</option>
              <option value="growing">Creciendo</option>
              <option value="ready">Lista</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={() => navigate("/")}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={createIdea.isPending}>
              {createIdea.isPending ? "Guardando..." : "Guardar idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
