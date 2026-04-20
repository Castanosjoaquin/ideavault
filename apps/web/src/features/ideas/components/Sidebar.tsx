import type { IdeasFilter } from "../hooks/useIdeas";
import styles from "./Sidebar.module.css";

type StageOption = NonNullable<IdeasFilter["stage"]>;

const STAGE_OPTIONS: { value: StageOption; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "seed", label: "Semilla" },
  { value: "growing", label: "Creciendo" },
  { value: "ready", label: "Listas" },
];

type Props = {
  filter: IdeasFilter;
  onFilterChange: (filter: IdeasFilter) => void;
};

export function Sidebar({ filter, onFilterChange }: Props) {
  const currentStage = filter.stage ?? "all";

  return (
    <aside className={styles.root}>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Buscar</span>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Título o categoría..."
          value={filter.search ?? ""}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value || undefined })}
        />
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Etapa</span>
        {STAGE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.filterButton}${currentStage === value ? ` ${styles.active}` : ""}`}
            onClick={() => onFilterChange({ ...filter, stage: value })}
          >
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
